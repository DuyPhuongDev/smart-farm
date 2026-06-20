import time
from Adafruit_IO import MQTTClient as AdafruitMQTT
from config.logger_config import logger
from typing import List


class MQTTClientWrapper:
    """Wrapper for Adafruit IO MQTT Client with dynamic subscription support"""
    
    def __init__(self, username, key, topics=None):
        """
        Initialize MQTT client
        
        Args:
            username: Adafruit IO username
            key: Adafruit IO key
            topics: Optional list of initial topics to subscribe to
                Example: [
                    "garden-1.humidity",
                    "garden-1.moisture",
                    "garden-1.temperature"
                ]
        """
        self.username = username
        self.key = key
        self.topics = topics or []
        self.client = None
        self.message_callback = None
        self.is_connected = False
    
    def set_message_callback(self, callback):
        """Set callback function to handle incoming messages"""
        self.message_callback = callback
    
    def _on_connect(self, client):
        """Internal callback when connected to Adafruit IO"""
        logger.info("Connected to Adafruit IO MQTT broker")
        self.is_connected = True
        
        # Subscribe to all configured feeds
        for topic in self.topics:
            try:
                client.subscribe(topic)
                logger.info(f"✓ Subscribed to topic: {topic}")
                time.sleep(0.5)  # Small delay between subscriptions
                
            except Exception as e:
                logger.error(f"Failed to subscribe to {topic}: {e}")
        
        logger.info(f"All subscriptions completed ({len(self.topics)} topics)")
    
    def _on_disconnect(self, client):
        """Internal callback when disconnected from Adafruit IO"""
        logger.warning("Disconnected from Adafruit IO")
        self.is_connected = False
    
    def _on_message(self, client, topic, payload):
        """Internal callback when a message is received"""
        try:
            logger.info(f"\n===== NEW MESSAGE =====")
            logger.info(f"Topic: {topic}")
            logger.info(f"Payload: {payload}")
            
            # Call external message handler if set
            if self.message_callback:
                self.message_callback(topic, payload)
            
        except Exception as e:
            logger.error(f"Error in message callback: {e}", exc_info=True)
    
    def connect(self):
        """Connect to Adafruit IO MQTT broker"""
        try:
            logger.info("Initializing MQTT client...")
            logger.info(f"   Username: {self.username}")
            logger.info(f"   Topics: {len(self.topics)} configured")
            
            # Create MQTT client
            self.client = AdafruitMQTT(self.username, self.key)
            
            # Set up callbacks
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            
            # Connect to broker
            logger.info("Connecting to Adafruit IO...")
            self.client.connect()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect MQTT client: {e}")
            return False
    
    def subscribe_topic(self, topic: str):
        """Subscribe to a new topic dynamically
        
        Args:
            topic: MQTT topic to subscribe to (e.g., "garden-1.humidity")
        """
        if topic in self.topics:
            logger.debug(f"Already subscribed to topic: {topic}")
            return
        
        # Add to topics list
        self.topics.append(topic)
        
        # Subscribe if client is connected
        if self.client and self.is_connected:
            try:
                self.client.subscribe(topic)
                logger.info(f"✓ Dynamically subscribed to topic: {topic}")
            except Exception as e:
                logger.error(f"Failed to subscribe to {topic}: {e}")
                self.topics.remove(topic)
    
    def unsubscribe_topic(self, topic: str):
        """Unsubscribe from a topic dynamically
        
        Args:
            topic: MQTT topic to unsubscribe from
        """
        if topic not in self.topics:
            logger.debug(f"Not subscribed to topic: {topic}")
            return
        
        # Remove from topics list
        self.topics.remove(topic)
        
        # Unsubscribe if client is connected
        if self.client and self.is_connected:
            try:
                self.client.unsubscribe(topic)
                logger.info(f"✓ Unsubscribed from topic: {topic}")
            except Exception as e:
                logger.error(f"Failed to unsubscribe from {topic}: {e}")
    
    def get_subscribed_topics(self) -> List[str]:
        """Get list of currently subscribed topics"""
        return self.topics.copy()
    
    def start_listening(self):
        """Start blocking loop to listen for messages"""
        if not self.client:
            logger.error("MQTT client not connected")
            return
        
        try:
            logger.info("Listening for messages... (Press Ctrl+C to exit)")
            self.client.loop_blocking()
        except Exception as e:
            logger.error(f"Error in MQTT loop: {e}")
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            try:
                self.client.disconnect()
                self.is_connected = False
                logger.info("MQTT client disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting MQTT client: {e}")