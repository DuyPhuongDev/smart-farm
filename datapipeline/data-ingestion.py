import os
import sys
from config.logger_config import setup_logger
from config.config import config
from config.kafka_producer import KafkaProducerClient
from config.mqtt_client import MQTTClientWrapper
from config.mqtt_kafka_bridge import MQTTKafkaBridge
from confluent_kafka.schema_registry import SchemaRegistryClient
from config.etcd_config_manager import EtcdConfigManager


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
    etcd_config_manager = None
    bridge = None
    
    try:
        logger.info("=" * 60)
        logger.info("Starting IoT Data Ingestion Service")
        logger.info("=" * 60)
        
        # 1. Initialize Etcd Config Manager & Load Snapshot
        logger.info("\n[1/5] Initializing Etcd Config Manager...")
        logger.info(f"   Etcd Host: {config.etcd.host}")
        logger.info(f"   Etcd Port: {config.etcd.port}")
        logger.info(f"   Etcd Prefix: {config.etcd.prefix}")
        
        etcd_config_manager = EtcdConfigManager(
            etcd_host=config.etcd.host,
            etcd_port=config.etcd.port
        )
        
        # Step 1: Load snapshot from etcd
        logger.info("\n   Loading device configurations snapshot...")
        device_configs = etcd_config_manager.load_snapshot(prefix=config.etcd.prefix)
        logger.info(f"   ✓ Loaded {len(device_configs)} device configurations")
        
        # Extract MQTT topics from device configs (only enabled devices)
        mqtt_topics = [
            cfg.mqtt_topic 
            for cfg in device_configs.values() 
            if cfg.enabled
        ]
        logger.info(f"   ✓ Active topics: {mqtt_topics}")
        
        # 2. Initialize Kafka Producer
        logger.info("\n[2/5] Initializing Kafka Producer...")
        logger.info(f"   Bootstrap Servers: {config.kafka.bootstrap_servers}")
        logger.info(f"   Target Topic: {config.kafka.topic}")
        
        kafka_producer = KafkaProducerClient(config.kafka.bootstrap_servers) 
        
        if not kafka_producer.producer:
            logger.error("Failed to initialize Kafka producer. Exiting...")
            return 1
        
        # 3. Initialize Schema Registry Client
        logger.info("\n[3/5] Initializing Schema Registry Client...")
        logger.info(f"   Schema Registry URL: {config.schema_registry.url}")
        schema_registry_client = SchemaRegistryClient(
            {'url': config.schema_registry.url}
        )
        
        # 4. Initialize MQTT-Kafka Bridge
        logger.info("\n[4/5] Initializing MQTT-Kafka Bridge...")
        bridge = MQTTKafkaBridge(
            kafka_producer=kafka_producer,
            kafka_topic=config.kafka.topic,
            schema_registry_client=schema_registry_client,
            device_configs=device_configs
        )
        logger.info(f"   ✓ Bridge configured")
        logger.info(f"   Kafka Topic: {config.kafka.topic}")
        logger.info(f"   Device Configs: {len(device_configs)} loaded")
        
        # 5. Initialize and connect MQTT Client
        logger.info("\n[5/5] Initializing MQTT Client...")
        logger.info(f"   Username: {config.adafruit.username}")
        logger.info(f"   Initial Topics: {len(mqtt_topics)} configured")
        
        mqtt_client = MQTTClientWrapper(
            username=config.adafruit.username,
            key=config.adafruit.key,
            topics=mqtt_topics
        )
        
        # Set bridge as message handler
        mqtt_client.set_message_callback(bridge.handle_message)
        
        # Connect to MQTT broker
        if not mqtt_client.connect():
            logger.error("Failed to connect MQTT client. Exiting...")
            return 1
        
        # 6. Setup Etcd Watch with callbacks for dynamic config changes
        logger.info("\n[6/6] Setting up Etcd watch for config changes...")
        
        def on_device_added(device_id: int, device_config):
            """Callback when device config is added or updated"""
            logger.info(f"\n🔄 Config change detected!")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   MQTT Topic: {device_config.mqtt_topic}")
            logger.info(f"   Sensor Type: {device_config.sensor_type}")
            logger.info(f"   Enabled: {device_config.enabled}")
            
            # Update bridge config
            bridge.add_device_config(device_id, device_config)
            
            # Subscribe to MQTT topic if enabled
            if device_config.enabled:
                mqtt_client.subscribe_topic(device_config.mqtt_topic)
                logger.info(f"   ✓ Subscribed to MQTT topic: {device_config.mqtt_topic}")
            else:
                # Unsubscribe if disabled
                mqtt_client.unsubscribe_topic(device_config.mqtt_topic)
                logger.info(f"   ✓ Unsubscribed from MQTT topic: {device_config.mqtt_topic}")
        
        def on_device_deleted(device_id: int, device_config):
            """Callback when device config is deleted
            
            Args:
                device_id: Device ID that was deleted
                device_config: DeviceConfig object (passed before deletion so we can access mqtt_topic)
            """
            logger.info(f"\n🗑️  Device config deleted!")
            logger.info(f"   Device ID: {device_id}")
            logger.info(f"   MQTT Topic: {device_config.mqtt_topic}")
            
            # Unsubscribe from MQTT topic
            mqtt_client.unsubscribe_topic(device_config.mqtt_topic)
            logger.info(f"   ✓ Unsubscribed from MQTT topic: {device_config.mqtt_topic}")
            
            # Remove from bridge
            bridge.remove_device_config(device_id)
            logger.info(f"   ✓ Removed device config")
        
        # Start watching for config changes (non-blocking)
        # replay_history=False: Only watch NEW events from now (ignore historical events)
        etcd_config_manager.watch_config_changes(
            on_put=on_device_added,
            on_delete=on_device_deleted,
            prefix=config.etcd.prefix,
            replay_history=False  # Don't replay historical events before service start
        )
        logger.info("   ✓ Watching for config changes (new events only)...")
        
        # 7. Start listening for MQTT messages
        logger.info("\n" + "=" * 60)
        logger.info("✓ Service started successfully!")
        logger.info("=" * 60)
        logger.info(f"📡 Monitoring {len(mqtt_topics)} topics from Adafruit IO")
        logger.info(f"📤 Forwarding to Kafka topic: {config.kafka.topic}")
        logger.info(f"🔧 Watching etcd prefix: {config.etcd.prefix}")
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
        
        # Stop watching etcd
        if etcd_config_manager:
            etcd_config_manager.stop_watching()
            logger.info("   ✓ Stopped etcd watch")
        
        # Disconnect MQTT client
        if mqtt_client:
            mqtt_client.disconnect()
            logger.info("   ✓ Disconnected MQTT client")
        
        # Close Kafka producer
        if kafka_producer:
            kafka_producer.close()
            logger.info("   ✓ Closed Kafka producer")
        
        logger.info("\n" + "=" * 60)
        logger.info("✓ Service stopped cleanly")
        logger.info("=" * 60)


if __name__ == "__main__":
    sys.exit(main())