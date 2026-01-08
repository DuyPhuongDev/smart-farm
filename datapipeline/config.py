import os
from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class AdafruitIOConfig:
    """Adafruit IO configuration"""
    username: str = os.getenv('AIO_USERNAME', 'dphuongdev')
    key: str = os.getenv('AIO_KEY', 'aio_vWpj24h5lR0GXgS89014cgLEOnll')
    

@dataclass
class SchemaRegistryConfig:
    """Schema Registry configuration"""
    url: str = os.getenv('SCHEMA_REGISTRY_URL', 'http://localhost:8081')


@dataclass
class KafkaConfig:
    """Kafka configuration"""
    bootstrap_servers: str = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:19092')
    topic: str = os.getenv('KAFKA_TOPIC', 'iot.sensor.raw.v1')
    processed_topic: str = os.getenv('KAFKA_PROCESSED_TOPIC', 'iot.sensor.processed.v1')
    client_id: str = os.getenv('KAFKA_CLIENT_ID', 'iot-mqtt-producer')
    flink_group_id: str = os.getenv('KAFKA_GROUP_ID', 'flink-job-group')


@dataclass
class FeedConfig:
    """MQTT Feed configuration"""
    group: str
    feed: str


@dataclass
class AppConfig:
    """Main application configuration"""
    
    # Adafruit IO
    adafruit: AdafruitIOConfig = field(default_factory=AdafruitIOConfig)
    
    # Kafka
    kafka: KafkaConfig = field(default_factory=KafkaConfig)
    
    # Schema Registry
    schema_registry: SchemaRegistryConfig = field(default_factory=SchemaRegistryConfig)
    
    # MQTT Feeds to subscribe
    feeds: List[Dict[str, str]] = field(default_factory=lambda: [
        {"group": "garden-1", "feed": "humidity"},
        {"group": "garden-1", "feed": "moisture"},
        {"group": "garden-1", "feed": "temperature"},
    ])
    
    # Sensor type mapping
    sensor_types: Dict[str, str] = field(default_factory=lambda: {
        "humidity": "HUMIDITY",
        "moisture": "MOISTURE",
        "temperature": "TEMPERATURE"
    })
    
    # Logging
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    log_file: str = os.getenv('LOG_FILE', 'logs/iot-service.log')


# Create global config instance
config = AppConfig()