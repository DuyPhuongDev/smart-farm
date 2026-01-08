import json
from logger_config import logger
from config import config
import random
import time
from kafka_producer import KafkaProducerClient
from avrc_schema import SensorData, SENSOR_DATA_SCHEMA
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import SerializationContext, MessageField

def generate_mock_sensor_data():
    """Generate mock sensor data for testing"""
    sensor_types = ["TEMPERATURE", "HUMIDITY", "MOISTURE"]
    group_name = "garden-1"
    feed_names = {
        "TEMPERATURE": "temperature",
        "HUMIDITY": "humidity",
        "MOISTURE": "moisture"
    }
    
    sensor_type = random.choice(sensor_types)
    feed_name = feed_names[sensor_type]
    
    if sensor_type == "TEMPERATURE":
        value = round(random.uniform(-20, 60), 2)
    elif sensor_type == "HUMIDITY":
        value = round(random.uniform(0, 100), 2)
    elif sensor_type == "MOISTURE":
        value = round(random.uniform(0, 100), 2)
    
    timestamp = int(time.time() * 1000)  # current time in milliseconds
    source = "MOCK_SENSOR"
    
    sensor_data = SensorData(
        group_name=group_name,
        feed_name=feed_name,
        value=value,
        sensor_type=sensor_type,
        timestamp=timestamp,
        source=source
    )
    
    return sensor_data

def main():
    """Main application entry point"""
    kafka_producer = None
    schema_registry_client = None
    avro_serializer = None
    
    try:
        logger.info("=" * 60)
        logger.info("Starting Mock Data Generator Service")
        logger.info("=" * 60)
        
        # 1. Initialize Kafka Producer
        logger.info("\n[1/3] Initializing Kafka Producer...")
        logger.info(f"   Bootstrap Servers: {config.kafka.bootstrap_servers}")
        logger.info(f"   Target Topic: {config.kafka.topic}")
        
        kafka_producer = KafkaProducerClient(config.kafka.bootstrap_servers)
        
        if not kafka_producer.producer:
            logger.error("Failed to initialize Kafka producer. Exiting...")
            return 1
        
        # 2. Initialize Schema Registry Client
        logger.info("\n[2/3] Initializing Schema Registry Client...")
        logger.info(f"   Schema Registry URL: {config.schema_registry.url}")
        schema_registry_client = SchemaRegistryClient(
            {'url': config.schema_registry.url}
        )
        
        # 3. Initialize Avro Serializer
        logger.info("\n[3/3] Initializing Avro Serializer...")
        avro_serializer = AvroSerializer(
            schema_registry_client,
            json.dumps(SENSOR_DATA_SCHEMA),
            lambda sensor_data, ctx: sensor_data.to_dict()
        )
        
        # Start generating and sending mock data
        logger.info("\n" + "=" * 60)
        logger.info("✓ Service started successfully!")
        logger.info("=" * 60)
        logger.info(f"📤 Sending mock data to Kafka topic: {config.kafka.topic}")
        logger.info(f"📝 Logs: {config.log_file}")
        logger.info(f"⏱️  Interval: 2 seconds")
        logger.info("=" * 60 + "\n")
        
        message_count = 0
        
        while True:
            # Generate mock sensor data
            sensor_data = generate_mock_sensor_data()
            
            # Serialize using Avro
            serialized_value = avro_serializer(
                sensor_data,
                SerializationContext(config.kafka.topic, MessageField.VALUE)
            )
            
            # Send to Kafka
            success = kafka_producer.send_message(
                topic=config.kafka.topic,
                message=serialized_value,
                key=sensor_data.sensor_type
            )
            
            if success:
                message_count += 1
                logger.info(
                    f"📨 [{message_count}] Sent: {sensor_data.sensor_type}={sensor_data.value:.2f} "
                    f"from {sensor_data.group_name}/{sensor_data.feed_name}"
                )
            
            # Wait before sending next message
            time.sleep(2)
        
    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Received shutdown signal (Ctrl+C)")
        logger.info("Shutting down gracefully...")
        return 0
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        return 1
        
    finally:
        # Cleanup
        logger.info("\n🧹 Cleaning up resources...")

        if kafka_producer:
            kafka_producer.close()
        
        logger.info("=" * 60)
        logger.info("✓ Service stopped cleanly")
        logger.info("=" * 60)
        
if __name__ == "__main__":
    main()