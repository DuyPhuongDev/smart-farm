"""
Setup script to populate etcd with sample device configurations

This script helps you quickly setup test data in etcd for development.
"""

import etcd3
import json
import sys
from logger_config import logger

# Sample device configurations
SAMPLE_DEVICES = [
    {
        "device_id": 1,
        "config": {
            "mqtt_topic": "garden-1.humidity",
            "sensor_type": "HUMIDITY",
            "enabled": True
        }
    },
    {
        "device_id": 2,
        "config": {
            "mqtt_topic": "garden-1.temperature",
            "sensor_type": "TEMPERATURE",
            "enabled": True
        }
    },
    {
        "device_id": 3,
        "config": {
            "mqtt_topic": "garden-1.moisture",
            "sensor_type": "MOISTURE",
            "enabled": True
        }
    },
]


def setup_etcd_data(etcd_host='localhost', etcd_port=2379, prefix='/iot/devices/'):
    """
    Setup sample device configurations in etcd
    
    Args:
        etcd_host: Etcd host
        etcd_port: Etcd port
        prefix: Key prefix for device configs
    """
    try:
        # Connect to etcd
        logger.info(f"Connecting to etcd at {etcd_host}:{etcd_port}...")
        client = etcd3.client(host=etcd_host, port=etcd_port)
        
        # Test connection
        try:
            client.status()
            logger.info("✓ Connected to etcd successfully")
        except Exception as e:
            logger.error(f"✗ Failed to connect to etcd: {e}")
            return False
        
        # Add each device configuration
        logger.info(f"\nAdding {len(SAMPLE_DEVICES)} device configurations...")
        logger.info("=" * 60)
        
        for device in SAMPLE_DEVICES:
            device_id = device['device_id']
            config = device['config']
            
            key = f"{prefix}{device_id}"
            value = json.dumps(config)
            
            # Put to etcd
            client.put(key, value)
            
            logger.info(f"\n✓ Added Device {device_id}:")
            logger.info(f"   Key: {key}")
            logger.info(f"   MQTT Topic: {config['mqtt_topic']}")
            logger.info(f"   Sensor Type: {config['sensor_type']}")
            logger.info(f"   Enabled: {config['enabled']}")
        
        logger.info("\n" + "=" * 60)
        logger.info("✓ All device configurations added successfully!")
        logger.info("=" * 60)
        
        # Verify by reading back
        logger.info("\nVerifying configurations...")
        for value, metadata in client.get_prefix(prefix):
            key = metadata.key.decode('utf-8')
            config_data = json.loads(value.decode('utf-8'))
            device_id = key.split('/')[-1]
            logger.info(f"  ✓ Device {device_id}: {config_data['mqtt_topic']}")
        
        logger.info("\n✅ Setup completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error setting up etcd data: {e}", exc_info=True)
        return False


def clear_etcd_data(etcd_host='localhost', etcd_port=2379, prefix='/iot/devices/'):
    """
    Clear all device configurations from etcd
    
    Args:
        etcd_host: Etcd host
        etcd_port: Etcd port
        prefix: Key prefix to clear
    """
    try:
        logger.info(f"Connecting to etcd at {etcd_host}:{etcd_port}...")
        client = etcd3.client(host=etcd_host, port=etcd_port)
        
        # Delete all keys with prefix
        logger.info(f"Clearing all keys with prefix: {prefix}")
        deleted = client.delete_prefix(prefix)
        
        logger.info(f"✓ Deleted {deleted} keys")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error clearing etcd data: {e}", exc_info=True)
        return False


def list_etcd_data(etcd_host='localhost', etcd_port=2379, prefix='/iot/devices/'):
    """
    List all device configurations in etcd
    
    Args:
        etcd_host: Etcd host
        etcd_port: Etcd port
        prefix: Key prefix to list
    """
    try:
        logger.info(f"Connecting to etcd at {etcd_host}:{etcd_port}...")
        client = etcd3.client(host=etcd_host, port=etcd_port)
        
        logger.info(f"\nListing all keys with prefix: {prefix}")
        logger.info("=" * 60)
        
        count = 0
        for value, metadata in client.get_prefix(prefix):
            key = metadata.key.decode('utf-8')
            config_data = json.loads(value.decode('utf-8'))
            device_id = key.split('/')[-1]
            
            logger.info(f"\nDevice {device_id}:")
            logger.info(f"   Key: {key}")
            logger.info(f"   MQTT Topic: {config_data['mqtt_topic']}")
            logger.info(f"   Sensor Type: {config_data['sensor_type']}")
            logger.info(f"   Enabled: {config_data['enabled']}")
            logger.info(f"   Revision: {metadata.mod_revision}")
            count += 1
        
        logger.info("\n" + "=" * 60)
        logger.info(f"Total: {count} device(s)")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error listing etcd data: {e}", exc_info=True)
        return False


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Etcd Device Configuration Setup')
    parser.add_argument(
        'action',
        choices=['setup', 'clear', 'list'],
        help='Action to perform: setup (add sample data), clear (remove all), list (show current)'
    )
    parser.add_argument(
        '--host',
        default='localhost',
        help='Etcd host (default: localhost)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=2379,
        help='Etcd port (default: 2379)'
    )
    parser.add_argument(
        '--prefix',
        default='/iot/devices/',
        help='Key prefix (default: /iot/devices/)'
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Etcd Device Configuration Setup")
    logger.info("=" * 60)
    
    if args.action == 'setup':
        success = setup_etcd_data(args.host, args.port, args.prefix)
    elif args.action == 'clear':
        # Ask for confirmation
        confirm = input("\n⚠️  Are you sure you want to clear all device configurations? (yes/no): ")
        if confirm.lower() == 'yes':
            success = clear_etcd_data(args.host, args.port, args.prefix)
        else:
            logger.info("Cancelled")
            return 0
    elif args.action == 'list':
        success = list_etcd_data(args.host, args.port, args.prefix)
    else:
        logger.error(f"Unknown action: {args.action}")
        return 1
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
