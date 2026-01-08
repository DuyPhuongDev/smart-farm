import json
from confluent_kafka import Producer
from logger_config import logger


class KafkaProducerClient:
    """Kafka Producer Client using Confluent Kafka"""
    
    def __init__(self, bootstrap_servers):
        """
        Initialize Kafka Producer
        
        Args:
            bootstrap_servers: Kafka broker address(es)
        """
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self._connect()
    
    def _connect(self):
        """Establish connection to Kafka"""
        try:
            config = {
                'bootstrap.servers': self.bootstrap_servers,
                'client.id': 'iot-mqtt-producer',
                'max.in.flight.requests.per.connection': 1,
                'compression.type': 'snappy',
                'linger.ms': 10,
                'batch.size': 16384
            }
            
            self.producer = Producer(config)
            logger.info(f"✓ Connected to Kafka: {self.bootstrap_servers}")
            
        except Exception as e:
            logger.error(f"✗ Failed to connect to Kafka: {e}")
            self.producer = None
    
    def _delivery_callback(self, err, msg):
        """Callback for message delivery reports"""
        if err:
            logger.error(f"✗ Message delivery failed: {err}")
        else:
            logger.info(
                f"✓ Message delivered to: "
                f"topic={msg.topic()}, "
                f"partition={msg.partition()}, "
                f"offset={msg.offset()}"
            )
    
    def send_message(self, topic, message, key=None):
        """
        Send message to Kafka topic
        
        Args:
            topic: Kafka topic name
            message: Message payload (dict)
            key: Optional message key (str)
        
        Returns:
            bool: True if message queued successfully
        """
        if not self.producer:
            logger.error("Kafka producer not available")
            return False
        
        try:
            # Serialize message to JSON
            # value = json.dumps(message).encode('utf-8')
            key_bytes = key.encode('utf-8') if key else None
            
            # Produce message (non-blocking)
            self.producer.produce(
                topic=topic,
                value=message,
                key=key_bytes,
                callback=self._delivery_callback
            )
            
            # Trigger callbacks (non-blocking)
            self.producer.poll(0)
            
            return True
            
        except BufferError:
            logger.error("Local producer queue is full. Waiting for messages to be delivered...")
            self.producer.poll(1)
            return False
            
        except Exception as e:
            logger.error(f"✗ Failed to send message to Kafka: {e}")
            return False
    
    def flush(self, timeout=10):
        """
        Wait for all messages to be delivered
        
        Args:
            timeout: Maximum time to wait in seconds
        """
        if self.producer:
            remaining = self.producer.flush(timeout)
            if remaining > 0:
                logger.warning(f"{remaining} messages were not delivered within timeout")
    
    def close(self):
        """Close Kafka producer connection"""
        if self.producer:
            try:
                logger.info("Flushing remaining messages...")
                self.flush(timeout=30)
                logger.info("Kafka producer closed")
            except Exception as e:
                logger.error(f"Error closing Kafka producer: {e}")