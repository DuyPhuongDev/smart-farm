import json
import psycopg2
from datetime import datetime
from config.avrc_schema import SensorData, SENSOR_DATA_SCHEMA
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer, AvroSerializer
from confluent_kafka.serialization import (MessageField, SerializationContext)

from pyflink.common import Time, Duration
from pyflink.common.typeinfo import Types
from pyflink.datastream.execution_mode import RuntimeExecutionMode
from pyflink.datastream.window import TumblingEventTimeWindows
from pyflink.common.serialization import ByteArraySchema, SerializationSchema, SimpleStringSchema
from pyflink.datastream.connectors.kafka import KafkaSource, KafkaOffsetsInitializer, KafkaSink, KafkaRecordSerializationSchema
from pyflink.common.watermark_strategy import WatermarkStrategy, TimestampAssigner
from pyflink.datastream import StreamExecutionEnvironment, ProcessWindowFunction, AggregateFunction, MapFunction, RuntimeContext
from config.config import config
from config.logger_config import logger


def filter_anomalous_data(event):
    """Filter out anomalous sensor data"""
    sensor_type = event.get('sensor_type')
    value = event.get('value')
    
    if sensor_type == "HUMIDITY":
        return 0 <= value <= 100
    elif sensor_type == "MOISTURE":
        return 0 <= value <= 100
    elif sensor_type == "TEMPERATURE":
        return -40 <= value <= 85
    return False

def convert_processed_data(t):
    dict_data = {
        "time": t[0],
        "device_id": t[1],
        "sensor_type": t[2],
        "avg_value": float(t[3]),
        "min_value": float(t[4]),
        "max_value": float(t[5]),
        "count": int(t[6])
    }
    return json.dumps(dict_data)

class EventTimeAssigner(TimestampAssigner):
    def extract_timestamp(self, value, record_timestamp) -> int:
        return value['timestamp']

class AvroDecodeMap(MapFunction):

    def open(self, runtime_context: RuntimeContext):
        self.ctx = SerializationContext(
            config.kafka.topic,
            MessageField.VALUE
        )

        self.sr_client = SchemaRegistryClient({
            "url": config.schema_registry.url
        })

        self.deserializer = AvroDeserializer(
            self.sr_client,
            json.dumps(SENSOR_DATA_SCHEMA),
            lambda obj, ctx: SensorData.from_dict(obj)
        )

    def map(self, value: bytes) -> dict:
        return self.deserializer(value, self.ctx).to_dict()

class AvgAgg(AggregateFunction):
    """AggregateFunction to compute average sensor data"""
    
    def create_accumulator(self):
        return (0.0, 0, float('inf'), float('-inf'))  # sum, count, min, max
    
    def add(self, value, acc):
        return acc[0] + value['value'], acc[1] + 1, min(acc[2], value['value']), max(acc[3], value['value'])
    
    def get_result(self, acc):
        return acc
    
    def merge(self, acc_a, acc_b):
        return acc_a[0] + acc_b[0], acc_a[1] + acc_b[1], min(acc_a[2], acc_b[2]), max(acc_a[3], acc_b[3])
    
class AvgProcess(ProcessWindowFunction):
    """ProcessWindowFunction to finalize average computation"""
    
    def process(self, key, context, aggregates):
        total, count, min_value, max_value = next(iter(aggregates))
        avg_value = total / count if count != 0 else 0
        yield (
            context.window().start,  # time (window_start as timestamp in ms)
            key[0],                  # device_id
            key[1],                  # sensor_type
            round(avg_value, 2),     # avg_value
            round(min_value, 2),     # min_value
            round(max_value, 2),     # max_value
            count                    # count
        )
        
class AvroValueSerializationSchema(SerializationSchema):

    def __init__(self, schema_registry_url, avro_schema, topic):
        self.schema_registry_client = SchemaRegistryClient(
            {"url": schema_registry_url}
        )
        self.avro_serializer = AvroSerializer(
            self.schema_registry_client,
            json.dumps(avro_schema),
            lambda obj, ctx: obj.to_dict()
        )
        self.topic = topic

    def serialize(self, value):
        return self.avro_serializer(
            value,
            SerializationContext(self.topic, MessageField.VALUE)
        )


class PostgreSQLWriter(MapFunction):
    """MapFunction to write data to PostgreSQL/TimescaleDB as a side effect"""
    
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
    
    def open(self, runtime_context: RuntimeContext):
        """Initialize database connection when map function is opened"""
        try:
            self.connection = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database=self.db_config['database'],
                user=self.db_config['user'],
                password=self.db_config['password']
            )
            self.cursor = self.connection.cursor()
            logger.info("PostgreSQL connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise
    
    def map(self, value):
        """Insert record into PostgreSQL and return the value for further processing"""
        try:
            # value is a tuple: (time_ms, device_id, sensor_type, avg_value, min_value, max_value, count)
            time_ms = value[0]
            device_id = value[1]
            sensor_type = value[2]
            avg_value = value[3]
            min_value = value[4]
            max_value = value[5]
            count = value[6]
            
            # Convert milliseconds to timestamp
            timestamp = datetime.fromtimestamp(time_ms / 1000.0)
            
            # Insert into TimescaleDB
            insert_query = """
                INSERT INTO sensor_metrics_30s 
                (time, device_id, sensor_type, avg_value, min_value, max_value, count)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            self.cursor.execute(insert_query, (
                timestamp, device_id, sensor_type, 
                avg_value, min_value, max_value, count
            ))
            self.connection.commit()
            
        except Exception as e:
            logger.error(f"Failed to insert record: {e}")
            self.connection.rollback()
        
        # Return the value for further processing
        return value
    
    def close(self):
        """Close database connection when map function is closed"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            logger.info("PostgreSQL connection closed")
        except Exception as e:
            logger.error(f"Error closing PostgreSQL connection: {e}")


def main():
    """Main application entry point for data processing"""
    
    logger.info("=" * 60)
    logger.info("Starting IoT Data Processing Service")
    logger.info("=" * 60)
    
    # init Flink execution environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_runtime_mode(RuntimeExecutionMode.STREAMING)
    
    # Add JDBC JAR dependencies to the environment
    import os
    jar_dir = os.path.dirname(os.path.abspath(__file__))
    jars = [
        os.path.join(jar_dir, "flink-connector-jdbc-3.3.0-1.20.jar"),
        os.path.join(jar_dir, "postgresql-42.7.8.jar"),
        os.path.join(jar_dir, "flink-sql-connector-kafka-4.0.1-2.0.jar")
    ]
    env.add_jars(*[f"file://{jar}" for jar in jars])
    
    # Event time is now the default and configured via WatermarkStrategy
    
    # configure Kafka source
    kafka_source = KafkaSource.builder() \
            .set_bootstrap_servers(config.kafka.bootstrap_servers) \
            .set_topics(config.kafka.topic) \
            .set_group_id(config.kafka.flink_group_id) \
            .set_starting_offsets(KafkaOffsetsInitializer.latest()) \
            .set_value_only_deserializer(ByteArraySchema()) \
            .build()
        
    # create data stream from Kafka source
    stream = env.from_source(
        kafka_source,
        watermark_strategy=WatermarkStrategy.no_watermarks(),
        source_name="kafka-raw-source"
    )
    
    water_mark_strategy = WatermarkStrategy \
        .for_bounded_out_of_orderness(Duration.of_seconds(5)) \
        .with_timestamp_assigner(EventTimeAssigner())
    
    # filter anomalous data add watermarks
    clean = stream \
        .map(AvroDecodeMap()) \
        .filter(filter_anomalous_data) \
        .assign_timestamps_and_watermarks(water_mark_strategy)
    
    # compute 30-second average
    avg_1m = clean \
    .key_by(lambda e: (e["device_id"], e["sensor_type"])) \
    .window(TumblingEventTimeWindows.of(Time.seconds(30))) \
    .aggregate(
        AvgAgg(),
        AvgProcess(),
        output_type=Types.TUPLE([
                        Types.LONG(),    # time (window_start)
                        Types.INT(),     # device_id
                        Types.STRING(),  # sensor_type
                        Types.FLOAT(),   # avg_value
                        Types.FLOAT(),   # min_value
                        Types.FLOAT(),   # max_value
                        Types.LONG(),    # count
                    ])
    )
    
    avg_1m.print()
    
    # Write to PostgreSQL/TimescaleDB using MapFunction
    postgres_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'smart_farm',
        'user': 'postgres',
        'password': 'postgres'
    }
    
    postgres_writer = PostgreSQLWriter(postgres_config)
    
    # Write to PostgreSQL and pass data through for Kafka sink
    avg_with_postgres = avg_1m.map(postgres_writer)
    
    avro_ready = avg_with_postgres.map(
        convert_processed_data,
        Types.STRING()
    )

    kafka_sink = KafkaSink.builder() \
        .set_bootstrap_servers(config.kafka.bootstrap_servers) \
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder() \
                .set_topic(config.kafka.processed_topic) \
                .set_value_serialization_schema(SimpleStringSchema()).build()     
        ).build()
    
    avro_ready.sink_to(kafka_sink)
    
    env.execute("IoT Data Processing Job")

if __name__ == "__main__":
    main()