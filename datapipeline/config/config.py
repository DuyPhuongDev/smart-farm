import os
from dataclasses import dataclass, field

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
class EtcdConfig:
    """Etcd configuration"""
    host: str = os.getenv('ETCD_HOST', 'localhost')
    port: int = os.getenv('ETCD_PORT', 2379)
    prefix: str = os.getenv('ETCD_PREFIX', '/iot/devices/')
    
@dataclass
class DeviceConfig:
    """Device configuration"""
    mqtt_topic: str
    sensor_type: str
    enabled: bool = True
    
@dataclass
class AppConfig:
    """Main application configuration"""
    
    # Adafruit IO
    adafruit: AdafruitIOConfig = field(default_factory=AdafruitIOConfig)
    
    # Kafka
    kafka: KafkaConfig = field(default_factory=KafkaConfig)
    
    # Schema Registry
    schema_registry: SchemaRegistryConfig = field(default_factory=SchemaRegistryConfig)
    
    # Etcd
    etcd: EtcdConfig = field(default_factory=EtcdConfig)
    
    # Logging
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    log_file: str = os.getenv('LOG_FILE', 'logs/iot-service.log')


# Create global config instance
config = AppConfig()