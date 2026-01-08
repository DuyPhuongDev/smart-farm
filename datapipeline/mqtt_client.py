import time
from Adafruit_IO import MQTTClient as AdafruitMQTT
from logger_config import logger


class MQTTClientWrapper:
    """Wrapper for Adafruit IO MQTT Client"""
    
    def __init__(self, username, key, feeds_config):
        """
        Initialize MQTT client
        
        Args:
            username: Adafruit IO username
            key: Adafruit IO key
            feeds_config: List of feed configurations
                Example: [
                    {"group": "garden-1", "feed": "humidity"},
                    {"group": "garden-1", "feed": "temperature"}
                ]
        """
        self.username = username
        self.key = key
        self.feeds_config = feeds_config
        self.client = None
        self.message_callback = None
    
    def set_message_callback(self, callback):
        """Set callback function to handle incoming messages"""
        self.message_callback = callback
    
    def _on_connect(self, client):
        """Internal callback when connected to Adafruit IO"""
        logger.info("Connected to Adafruit IO MQTT broker")
        
        # Subscribe to all configured feeds
        for feed_config in self.feeds_config:
            try:
                group = feed_config.get("group")
                feed = feed_config.get("feed")
                feed_key = f"{group}.{feed}"
                
                client.subscribe(feed_key)
                logger.info(f"Subscribed to feed: {feed_key}")
                time.sleep(0.5)  # Small delay between subscriptions
                
            except Exception as e:
                logger.error(f"Failed to subscribe to {feed_key}: {e}")
        
        logger.info("All subscriptions completed")
    
    def _on_disconnect(self, client):
        """Internal callback when disconnected from Adafruit IO"""
        logger.warning("Disconnected from Adafruit IO")
    
    def _on_message(self, client, feed_id, payload):
        """Internal callback when a message is received"""
        try:
            logger.info(f"\n===== NEW MESSAGE =====")
            logger.info(f"Feed: {feed_id}")
            logger.info(f"Payload: {payload}")
            
            # Call external message handler if set
            if self.message_callback:
                self.message_callback(feed_id, payload)
            
        except Exception as e:
            logger.error(f"Error in message callback: {e}", exc_info=True)
    
    def connect(self):
        """Connect to Adafruit IO MQTT broker"""
        try:
            logger.info("Initializing MQTT client...")
            logger.info(f"   Username: {self.username}")
            logger.info(f"   Feeds: {len(self.feeds_config)} configured")
            
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
                logger.info("MQTT client disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting MQTT client: {e}")