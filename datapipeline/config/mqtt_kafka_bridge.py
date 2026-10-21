import time
from config.logger_config import logger
import json
from typing import Dict
from config.avrc_schema import SensorData, SENSOR_DATA_SCHEMA
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import (MessageField, SerializationContext)
from config.config import DeviceConfig

class MQTTKafkaBridge:
    """Bridge between MQTT and Kafka - handles message transformation and routing"""
    
    def __init__(self, kafka_producer, kafka_topic, schema_registry_client, device_configs=None):
        """
        Initialize bridge
        
        Args:
            kafka_producer: KafkaProducerClient instance
            kafka_topic: Kafka topic to send messages to
            schema_registry_client: SchemaRegistryClient instance
            device_configs: Dict of device configurations (device_id -> DeviceConfig)
                Example: {
                    1: DeviceConfig(mqtt_topic="garden-1.humidity", sensor_type="HUMIDITY", enabled=True),
                    2: DeviceConfig(mqtt_topic="garden-1.temperature", sensor_type="TEMPERATURE", enabled=True)
                }
        """
        self.kafka_producer = kafka_producer
        self.kafka_topic = kafka_topic
        self.device_configs: Dict[int, DeviceConfig] = device_configs or {}
        self.schema_registry_client = schema_registry_client
        self.avro_serializer = AvroSerializer(
            schema_registry_client,
            json.dumps(SENSOR_DATA_SCHEMA),
            lambda obj, ctx: obj.to_dict()
        )
        # Create topic -> device_id mapping for faster lookup
        self.topic_to_device_id = self._build_topic_mapping()
    
    def _build_topic_mapping(self) -> Dict[str, int]:
        """Build mapping from MQTT topic to device_id"""
        mapping = {}
        for device_id, config in self.device_configs.items():
            if config.enabled:
                mapping[config.mqtt_topic] = device_id
        return mapping
    
    def add_device_config(self, device_id: int, config: DeviceConfig):
        """Add or update a device configuration
        
        Args:
            device_id: Device ID
            config: DeviceConfig instance
        """
        self.device_configs[device_id] = config
        if config.enabled:
            self.topic_to_device_id[config.mqtt_topic] = device_id
            logger.info(f"Added device config: device_id={device_id}, topic={config.mqtt_topic}")
        else:
            # Remove from mapping if disabled
            if config.mqtt_topic in self.topic_to_device_id:
                del self.topic_to_device_id[config.mqtt_topic]
            logger.info(f"Added device config (disabled): device_id={device_id}, topic={config.mqtt_topic}")
    
    def remove_device_config(self, device_id: int):
        """Remove a device configuration
        
        Args:
            device_id: Device ID to remove
        """
        if device_id in self.device_configs:
            config = self.device_configs[device_id]
            # Remove from topic mapping
            if config.mqtt_topic in self.topic_to_device_id:
                del self.topic_to_device_id[config.mqtt_topic]
            # Remove from configs
            del self.device_configs[device_id]
            logger.info(f"Removed device config: device_id={device_id}, topic={config.mqtt_topic}")
    
    def get_device_configs(self) -> Dict[int, DeviceConfig]:
        """Get current device configurations"""
        return self.device_configs.copy()
    
    def handle_message(self, topic, payload):
        """
        Handle incoming MQTT message and forward to Kafka
        
        Args:
            topic: MQTT topic (e.g., "garden-1.temperature")
            payload: Message payload value
        """
        try:
            # Find device_id from topic mapping
            device_id = self.topic_to_device_id.get(topic)
            if device_id is None:
                logger.warning(f"No device configuration found for topic: {topic}")
                return
            
            # Get device config
            device_config = self.device_configs.get(device_id)
            if not device_config or not device_config.enabled:
                logger.warning(f"Device {device_id} is disabled or not found")
                return
            
            sensor_type = device_config.sensor_type
            
            # Parse topic format: "garden-1.temperature"
            if "." not in topic:
                logger.warning(f"Unexpected topic format: {topic}")
                return
            
            parts = topic.split(".")
            group_name = parts[0]
            feed_name = parts[1] if len(parts) > 1 else "unknown"
            
            logger.info(f"Processing message:")
            logger.info(f"   Group: {group_name}")
            logger.info(f"   Feed: {feed_name}")
            logger.info(f"   Value: {payload}")
            
            # Transform message to Kafka event format
            message_key, event = self._transform_to_kafka_event(
                device_id,
                payload,
                sensor_type
            )
            
            # Send to Kafka
            serialized_event = self.avro_serializer(
                event,
                SerializationContext(self.kafka_topic, MessageField.VALUE)
            )
            self._send_to_kafka(message_key, serialized_event)
            
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
    
    def _transform_to_kafka_event(self, device_id, value, sensor_type):
        """
        Transform MQTT message to Kafka event format
        
        Args:
            device_id: Device ID
            value: Sensor value
            sensor_type: Type of sensor (TEMPERATURE, HUMIDITY, etc.)
        
        Returns:
            tuple: (message_key, event) - message key for partitioning and SensorData event
        """
        # Use sensor_type as message key for partitioning
        message_key = sensor_type
        
        event = SensorData(
            device_id=device_id,
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