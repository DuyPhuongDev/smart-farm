"""
Example script demonstrating how to use the Etcd Config Manager
with the new flow: LOAD SNAPSHOT -> WATCH -> HANDLE PUT/DELETE

This script shows how to:
1. Load initial configuration snapshot
2. Watch for changes
3. Handle PUT (add/update) events
4. Handle DELETE events
"""

import json
import time
from etcd_config_manager import EtcdConfigManager
from config import DeviceConfig

def main():
    print("=" * 60)
    print("Etcd Config Manager - Example Usage")
    print("=" * 60)
    
    # Initialize manager
    manager = EtcdConfigManager(
        etcd_host='localhost',
        etcd_port=2379
    )
    
    # ============================================
    # Step 1: LOAD SNAPSHOT
    # ============================================
    print("\n[Step 1] Loading snapshot from etcd...")
    prefix = '/iot/devices/'
    
    configs = manager.load_snapshot(prefix=prefix)
    
    print(f"\n✓ Loaded {len(configs)} device configurations:")
    for device_id, config in configs.items():
        print(f"   Device {device_id}:")
        print(f"      - MQTT Topic: {config.mqtt_topic}")
        print(f"      - Sensor Type: {config.sensor_type}")
        print(f"      - Enabled: {config.enabled}")
    
    print(f"\nLast revision: {manager.last_revision}")
    
    # ============================================
    # Step 2-3: SUBSCRIBE ACTIVE + START WATCH
    # ============================================
    print("\n[Step 2-3] Starting watch for config changes...")
    
    def on_device_put(device_id: int, config: DeviceConfig):
        """Handle device add/update"""
        print(f"\n🔄 PUT Event Detected!")
        print(f"   Device ID: {device_id}")
        print(f"   MQTT Topic: {config.mqtt_topic}")
        print(f"   Sensor Type: {config.sensor_type}")
        print(f"   Enabled: {config.enabled}")
        print(f"   Action: {'Updated' if device_id in manager.current_configs else 'Added'}")
    
    def on_device_delete(device_id: int):
        """Handle device delete"""
        print(f"\n🗑️  DELETE Event Detected!")
        print(f"   Device ID: {device_id}")
        print(f"   Action: Removed from config")
    
    # Start watching (non-blocking, runs in background thread)
    manager.watch_config_changes(
        on_put=on_device_put,
        on_delete=on_device_delete,
        prefix=prefix
    )
    
    print("✓ Watch started successfully!")
    print(f"   Watching prefix: {prefix}")
    print(f"   Starting from revision: {manager.last_revision + 1 if manager.last_revision else 'latest'}")
    
    # ============================================
    # Keep running to receive events
    # ============================================
    print("\n" + "=" * 60)
    print("Service is running...")
    print("Try adding/updating/deleting devices in etcd to see events")
    print("Press Ctrl+C to stop")
    print("=" * 60 + "\n")
    
    try:
        # Keep running
        while True:
            # Get current config count
            current = manager.get_current_configs()
            print(f"\r[{time.strftime('%H:%M:%S')}] Monitoring {len(current)} devices...", end='', flush=True)
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Stopping service...")
        manager.stop_watching()
        print("✓ Service stopped")


# ============================================
# Helper functions to manipulate etcd
# ============================================
def add_device_example():
    """Example: Add a new device to etcd"""
    import etcd3
    client = etcd3.client(host='localhost', port=2379)
    
    device_config = {
        "mqtt_topic": "garden-1.humidity",
        "sensor_type": "HUMIDITY",
        "enabled": True
    }
    
    key = '/iot/devices/1'
    value = json.dumps(device_config)
    
    client.put(key, value)
    print(f"✓ Added device to {key}")


def update_device_example():
    """Example: Update an existing device in etcd"""
    import etcd3
    client = etcd3.client(host='localhost', port=2379)
    
    device_config = {
        "mqtt_topic": "garden-1.humidity",
        "sensor_type": "HUMIDITY",
        "enabled": False  # Disable device
    }
    
    key = '/iot/devices/1'
    value = json.dumps(device_config)
    
    client.put(key, value)
    print(f"✓ Updated device at {key}")


def delete_device_example():
    """Example: Delete a device from etcd"""
    import etcd3
    client = etcd3.client(host='localhost', port=2379)
    
    key = '/iot/devices/1'
    
    client.delete(key)
    print(f"✓ Deleted device at {key}")


if __name__ == "__main__":
    main()
    
    # Uncomment to test manipulating etcd:
    # add_device_example()
    # update_device_example()
    # delete_device_example()
