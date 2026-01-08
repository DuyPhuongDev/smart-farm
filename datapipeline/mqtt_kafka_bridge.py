import time
from datetime import datetime, timezone
from logger_config import logger
import json
from avrc_schema import SensorData, SENSOR_DATA_SCHEMA
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import (MessageField, SerializationContext)



class MQTTKafkaBridge:
    """Bridge between MQTT and Kafka - handles message transformation and routing"""
    
    def __init__(self, kafka_producer, kafka_topic, schema_registry_client, sensor_types_mapping):
        """
        Initialize bridge
        
        Args:
            kafka_producer: KafkaProducerClient instance
            kafka_topic: Kafka topic to send messages to
            schema_registry_client: SchemaRegistryClient instance
            sensor_types_mapping: Dict mapping feed names to sensor types
                Example: {"humidity": "HUMIDITY", "temperature": "TEMPERATURE"}
        """
        self.kafka_producer = kafka_producer
        self.kafka_topic = kafka_topic
        self.schema_registry_client = schema_registry_client
        self.avro_serializer = AvroSerializer(
            schema_registry_client,
            json.dumps(SENSOR_DATA_SCHEMA),
            lambda obj, ctx: obj.to_dict()
        )
        self.sensor_types_mapping = sensor_types_mapping
    
    def handle_message(self, feed_id, payload):
        """
        Handle incoming MQTT message and forward to Kafka
        
        Args:
            feed_id: MQTT feed identifier (e.g., "garden-1.temperature")
            payload: Message payload value
        """
        try:
            # Parse feed_id format: "garden-1.temperature"
            if "." not in feed_id:
                logger.warning(f"Unexpected feed_id format: {feed_id}")
                return
            
            parts = feed_id.split(".")
            group_name = parts[0]
            feed_name = parts[1] if len(parts) > 1 else "unknown"
            
            logger.info(f"Processing message:")
            logger.info(f"   Group: {group_name}")
            logger.info(f"   Feed: {feed_name}")
            logger.info(f"   Value: {payload}")
            
            # Transform message to Kafka event format
            message_key, event = self._transform_to_kafka_event(
                group_name, 
                feed_name, 
                payload
            )
            
            # Send to Kafka
            serialized_event = self.avro_serializer(
                event,
                SerializationContext(self.kafka_topic, MessageField.VALUE)
            )
            self._send_to_kafka(message_key, serialized_event)
            
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
    
    def _transform_to_kafka_event(self, group_name, feed_name, value):
        """
        Transform MQTT message to Kafka event format
        
        Returns:
            dict: Kafka event payload
        """
        sensor_type = self.sensor_types_mapping.get(feed_name, "UNKNOWN")
        # Use sensor_type as message key for partitioning
        message_key = sensor_type
        
        event = SensorData(
            group_name=group_name,
            feed_name=feed_name,
            value=value,
            sensor_type=sensor_type,
            timestamp=int(time.time() * 1000),
            source="adafruit_io"
        )
        
        logger.debug(f"Transformed event: {event}")
        return message_key, event
    
    def _send_to_kafka(self, message_key, event):
        """Send event to Kafka"""
        if not self.kafka_producer or not self.kafka_producer.producer:
            logger.warning("Kafka producer not available, message not sent")
            return
        
        try:
            
            
            success = self.kafka_producer.send_message(
                self.kafka_topic,
                event,
                key=message_key
            )
            
            if success:
                logger.info(f"✓ Event forwarded to Kafka topic '{self.kafka_topic}'")
            else:
                logger.error(f"✗ Failed to forward event to Kafka")
                
        except Exception as e:
            logger.error(f"Error sending to Kafka: {e}", exc_info=True)