import etcd3
import json
from typing import Callable, Dict, Optional
import threading
from config.logger_config import logger
from config.config import DeviceConfig

class EtcdConfigManager:
    """Manages dynamic configuration from etcd with watch capability
    
    Flow:
    1. LOAD SNAPSHOT (get_prefix) - Load all existing configs
    2. SUBSCRIBE ACTIVE - Register callback
    3. START WATCH (revision + 1) - Watch from next revision
    4. HANDLE PUT / DELETE - Handle change events
    """
    
    def __init__(self, etcd_host='localhost', etcd_port=2379):
        """Initialize etcd client"""
        self.client = etcd3.client(host=etcd_host, port=etcd_port)
        self.watch_thread = None
        self.stop_watch = False
        self.current_configs: Dict[str, DeviceConfig] = {}
        self.last_revision: Optional[int] = None
        
    def _parse_config(self, config: dict) -> DeviceConfig:
        """Parse etcd configuration into DeviceConfig object"""
        return DeviceConfig(
            mqtt_topic=config['mqtt_topic'], 
            sensor_type=config['sensor_type'], 
            enabled=config['enabled'],
        )
    
    def load_snapshot(self, prefix='/iot/devices/') -> Dict[int, DeviceConfig]:
        """Step 1: LOAD SNAPSHOT - Get all configurations with prefix
        
        Returns:
            Dict mapping device_id to DeviceConfig
            device_id is the index of the config in the list
        """
        logger.info(f"Loading snapshot from etcd with prefix: {prefix}")
        configs = {}
        
        # Get all keys with prefix and metadata
        for value, metadata in self.client.get_prefix(prefix):
            try:
                key = metadata.key.decode('utf-8')
                device_id = int(key.split('/')[-1])
                
                if value:
                    config_data = json.loads(value.decode('utf-8'))
                    config = self._parse_config(config_data)
                    configs[device_id] = config
                    logger.info(f"Loaded config for device: {device_id}")
                
                # Track the revision for watching -> get the latest revision
                if metadata.mod_revision > (self.last_revision or 0):
                    self.last_revision = metadata.mod_revision
                    
            except Exception as e:
                logger.error(f"Error parsing config for key {metadata.key}: {e}")
        
        self.current_configs = configs
        logger.info(f"Snapshot loaded: {len(configs)} devices, last_revision: {self.last_revision}")
        return configs
    
    def watch_config_changes(
        self, 
        on_put: Callable[[int, DeviceConfig], None],
        on_delete: Callable[[int, DeviceConfig], None],
        prefix: str = '/iot/devices/',
        replay_history: bool = False
    ):
        """Steps 2-4: SUBSCRIBE ACTIVE + START WATCH + HANDLE EVENTS
        
        Args:
            on_put: Callback for PUT events (device_id, config)
            on_delete: Callback for DELETE events (device_id, config)
                      Note: config is passed so callback can access mqtt_topic for unsubscribe
            prefix: Etcd prefix to watch
            replay_history: If True, replay all events from snapshot revision + 1
                           If False, only watch new events from now (default)
                           
        Note:
            - replay_history=False: Only receive events that happen AFTER watch starts
            - replay_history=True: Replay all historical events since snapshot, then continue watching
        """
        def watch_loop():
            # Calculate start revision based on replay_history flag
            if replay_history:
                # Watch from last_revision + 1 to replay all events since snapshot
                start_revision = (self.last_revision + 1) if self.last_revision else None
                logger.info(f"Starting watch on prefix: {prefix}, start_revision: {start_revision} (with history replay)")
            else:
                # Watch from now, only new events (no history replay)
                start_revision = None
                logger.info(f"Starting watch on prefix: {prefix} (new events only, no history)")
            
            # Watch prefix
            events_iterator, cancel = self.client.watch_prefix(
                prefix, 
                start_revision=start_revision
            )
            
            try:
                for event in events_iterator:
                    if self.stop_watch:
                        break
                    
                    key = event.key.decode('utf-8')
                    device_id = int(key.split('/')[-1])
                    
                    # Handle PUT event
                    if isinstance(event, etcd3.events.PutEvent):
                        try:
                            config_data = json.loads(event.value.decode('utf-8'))
                            config = self._parse_config(config_data)
                            self.current_configs[device_id] = config
                            
                            logger.info(f"PUT event for device: {device_id}")
                            on_put(device_id, config)
                            
                        except Exception as e:
                            logger.error(f"Error handling PUT event for {key}: {e}")
                    
                    # Handle DELETE event
                    elif isinstance(event, etcd3.events.DeleteEvent):
                        # Get config BEFORE deleting for callback to use
                        config = self.current_configs.get(device_id)
                        
                        if device_id in self.current_configs:
                            del self.current_configs[device_id]
                        
                        logger.info(f"DELETE event for device: {device_id}")
                        
                        # Pass config to callback so it can access mqtt_topic for unsubscribe
                        if config:
                            on_delete(device_id, config)
                        else:
                            logger.warning(f"Config for device {device_id} not found in cache during DELETE")
                    
                    # Update last revision
                    if hasattr(event, 'mod_revision'):
                        self.last_revision = event.mod_revision
                        
            except Exception as e:
                logger.error(f"Error in watch loop: {e}")
            finally:
                cancel()
        
        self.watch_thread = threading.Thread(target=watch_loop, daemon=True)
        self.watch_thread.start()
    
    def get_current_configs(self) -> Dict[int, DeviceConfig]:
        """Get current cached configurations"""
        return self.current_configs.copy()
    
    def stop_watching(self):
        """Stop watching for changes"""
        self.stop_watch = True
        if self.watch_thread:
            self.watch_thread.join(timeout=5)
            logger.info("Watch stopped")
    