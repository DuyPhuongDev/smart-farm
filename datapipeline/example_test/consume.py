import json
from logger_config import logger
from config import config
from confluent_kafka import Consumer, KafkaError
import argparse
from avrc_schema import SensorData, SENSOR_DATA_SCHEMA
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroDeserializer
from confluent_kafka.serialization import (MessageField, SerializationContext)

def main():
    parser = argparse.ArgumentParser(description="Test Kafka Consumer for IoT Sensor Data")
    parser.add_argument("--group-id", "-g", help="Kafka Consumer Group ID")
    parser.add_argument("--topic", "-t", help="Kafka Topic to subscribe to")
    
    args = parser.parse_args()
    group_id = args.group_id
    topic = args.topic
    
    schema_registry_client = SchemaRegistryClient(
        {'url': config.schema_registry.url}
    )
    
    avro_deserializer = AvroDeserializer(
        schema_registry_client,
        json.dumps(SENSOR_DATA_SCHEMA),
        lambda obj, ctx: SensorData.from_dict(obj)
    )
    
    consumer_conf = {
        'bootstrap.servers': config.kafka.bootstrap_servers,
        'group.id': group_id,
        "auto.offset.reset": 'earliest'
    }
    
    consumer = Consumer(consumer_conf)
    consumer.subscribe([topic])
    logger.info(f"Subscribed to topic: {topic} with group ID: {group_id}")
    
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                # No new message
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"Kafka error: {msg.error()}")
                    continue
            
            process_message(avro_deserializer, msg)
    except KeyboardInterrupt:
        logger.info("Consumer interrupted by user")
    finally:
        consumer.close()
        logger.info("Kafka consumer closed")
                
                
def process_message(avro_deserializer, msg):
    """Process and print the Kafka message"""
    data = avro_deserializer(
        msg.value(),
        SerializationContext(msg.topic(), MessageField.VALUE)
    )
    
    if data is not None:
        logger.info(f"Received Sensor Data: {data}")
    else:
        logger.warning("Failed to deserialize message")
if __name__ == "__main__":
    main()