import os
import sys
from logger_config import setup_logger
import json
from config import config
from kafka_producer import KafkaProducerClient
from mqtt_client import MQTTClientWrapper
from mqtt_kafka_bridge import MQTTKafkaBridge
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer
from avrc_schema import SENSOR_DATA_SCHEMA


def ensure_log_directory():
    """Ensure logs directory exists"""
    log_dir = os.path.dirname(config.log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)


def main():
    """Main application entry point"""
    
    # Setup logger
    ensure_log_directory()
    logger = setup_logger(
        name='iot-service',
        level=config.log_level,
        # log_file=config.log_file
    )
    
    kafka_producer = None
    mqtt_client = None
    schema_registry_client = None
    
    try:
        logger.info("=" * 60)
        logger.info("Starting IoT Data Ingestion Service")
        logger.info("=" * 60)
        
        # 1. Initialize Kafka Producer
        logger.info("\n[1/4] Initializing Kafka Producer...")
        logger.info(f"   Bootstrap Servers: {config.kafka.bootstrap_servers}")
        logger.info(f"   Target Topic: {config.kafka.topic}")
        
        kafka_producer = KafkaProducerClient(config.kafka.bootstrap_servers)
        
        if not kafka_producer.producer:
            logger.error("Failed to initialize Kafka producer. Exiting...")
            return 1
        
        # 2. Initialize Schema Registry Client
        logger.info("\n[2/4] Initializing Schema Registry Client...")
        logger.info(f"   Schema Registry URL: {config.schema_registry.url}")
        schema_registry_client = SchemaRegistryClient(
            {'url': config.schema_registry.url}
        )
        
        # 3. Initialize MQTT-Kafka Bridge
        logger.info("\n[3/4] Initializing MQTT-Kafka Bridge...")
        bridge = MQTTKafkaBridge(
            kafka_producer=kafka_producer,
            kafka_topic=config.kafka.topic,
            schema_registry_client=schema_registry_client,
            sensor_types_mapping=config.sensor_types
        )
        logger.info(f"✓ Bridge configured")
        logger.info(f"   Topic: {config.kafka.topic}")
        logger.info(f"   Sensor Types: {len(config.sensor_types)} mapped")
        
        # 4. Initialize and connect MQTT Client
        logger.info("\n[4/4] Initializing MQTT Client...")
        logger.info(f"   Username: {config.adafruit.username}")
        logger.info(f"   Feeds: {len(config.feeds)} configured")
        
        mqtt_client = MQTTClientWrapper(
            username=config.adafruit.username,
            key=config.adafruit.key,
            feeds_config=config.feeds
        )
        
        # Set bridge as message handler
        mqtt_client.set_message_callback(bridge.handle_message)
        
        # Connect to MQTT broker
        if not mqtt_client.connect():
            logger.error("Failed to connect MQTT client. Exiting...")
            return 1
        
        # 5. Start listening for messages
        logger.info("\n" + "=" * 60)
        logger.info("✓ Service started successfully!")
        logger.info("=" * 60)
        logger.info(f"📡 Monitoring {len(config.feeds)} feeds from Adafruit IO")
        logger.info(f"📤 Forwarding to Kafka topic: {config.kafka.topic}")
        logger.info(f"📝 Logs: {config.log_file}")
        logger.info("=" * 60 + "\n")
        
        mqtt_client.start_listening()
        
        return 0
        
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
        
        if mqtt_client:
            mqtt_client.disconnect()
        
        if kafka_producer:
            kafka_producer.close()
        
        logger.info("=" * 60)
        logger.info("✓ Service stopped cleanly")
        logger.info("=" * 60)


if __name__ == "__main__":
    sys.exit(main())