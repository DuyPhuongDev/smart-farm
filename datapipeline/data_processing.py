import json
from avrc_schema import SensorData, SENSOR_DATA_SCHEMA, PROCESSED_DATA_SCHEMA
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
from config import config
from logger_config import logger

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
        "group_name": t[0],
        "feed_name": t[1],
        "sensor_type": t[2],
        "window_start": t[3],
        "window_end": t[4],
        "avg_value": float(t[5]),
        "min_value": float(t[6]),
        "max_value": float(t[7]),
        "count": int(t[8]),
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
            key[0],
            key[1],
            key[2],
            context.window().start,
            context.window().end,
            round(avg_value, 2),
            round(min_value, 2),
            round(max_value, 2),
            count
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


def main():
    """Main application entry point for data processing"""
    
    logger.info("=" * 60)
    logger.info("Starting IoT Data Processing Service")
    logger.info("=" * 60)
    
    # init Flink execution environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_runtime_mode(RuntimeExecutionMode.STREAMING)
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
    .key_by(lambda e: (e["group_name"], e["feed_name"], e["sensor_type"])) \
    .window(TumblingEventTimeWindows.of(Time.seconds(30))) \
    .aggregate(
        AvgAgg(),
        AvgProcess(),
        output_type=Types.TUPLE([
                        Types.STRING(),  # group_name
                        Types.STRING(),  # feed_name
                        Types.STRING(),  # sensor_type
                        Types.LONG(),    # window_start
                        Types.LONG(),    # window_end
                        Types.FLOAT(),   # avg
                        Types.FLOAT(),   # min
                        Types.FLOAT(),   # max
                        Types.LONG(),    # count
                    ])
    )
    
    avg_1m.print()
    
    avro_ready = avg_1m.map(
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