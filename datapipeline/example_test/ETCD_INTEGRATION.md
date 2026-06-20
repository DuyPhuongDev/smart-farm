# Etcd Dynamic Configuration Integration

## 📋 Tổng quan

Hệ thống đã được cập nhật để load và watch configuration từ Etcd theo flow chuẩn:

```
START
  ↓
LOAD SNAPSHOT (get_prefix)
  ↓
SUBSCRIBE ACTIVE (register callbacks)
  ↓
START WATCH (revision + 1)
  ↓
HANDLE PUT / DELETE (dynamic updates)
```

## 🔄 Flow hoạt động

### 1. **LOAD SNAPSHOT**
- Sử dụng `get_prefix()` để load tất cả configs với prefix
- Lưu `last_revision` để track version
- Cache configs vào `current_configs`

### 2. **SUBSCRIBE ACTIVE**
- Register callbacks cho PUT và DELETE events
- Callbacks được gọi khi có thay đổi config

### 3. **START WATCH**
- Bắt đầu watch từ `revision + 1`
- Đảm bảo không miss events giữa snapshot và watch

### 4. **HANDLE PUT/DELETE**
- **PUT**: Add/Update device config → Subscribe MQTT topic
- **DELETE**: Config passed to callback BEFORE removal → Unsubscribe MQTT topic → Remove config
  - **Important:** Config is passed to `on_delete` callback so you can access `mqtt_topic` for cleanup

## 📁 Files đã thay đổi

### 1. `etcd_config_manager.py`
**Thay đổi chính:**
- ✅ Thêm `load_snapshot()` - Load initial configs với `get_prefix()`
- ✅ Track `last_revision` từ metadata
- ✅ `watch_config_changes()` - Watch từ revision + 1
- ✅ Separate callbacks cho PUT và DELETE events
- ✅ Cache `current_configs` cho fast access

**API:**
```python
# Load snapshot
configs = manager.load_snapshot(prefix='/iot/devices/')

# Watch changes
def handle_put(device_id: int, config: DeviceConfig):
    print(f"Device {device_id} added/updated")

def handle_delete(device_id: int, config: DeviceConfig):
    # config is passed so you can access mqtt_topic before it's removed
    print(f"Device {device_id} deleted, topic was: {config.mqtt_topic}")

manager.watch_config_changes(
    on_put=handle_put,        # Callback for add/update
    on_delete=handle_delete,  # Callback for delete (receives config before removal)
    prefix='/iot/devices/'
)

# Get current configs
current = manager.get_current_configs()
```

### 2. `mqtt_client.py`
**Thay đổi chính:**
- ✅ Thêm `subscribe_topic()` - Dynamic subscribe
- ✅ Thêm `unsubscribe_topic()` - Dynamic unsubscribe
- ✅ Track `is_connected` state
- ✅ Support khởi tạo với empty topics list

**API:**
```python
# Dynamic subscribe
mqtt_client.subscribe_topic("garden-1.humidity")

# Dynamic unsubscribe
mqtt_client.unsubscribe_topic("garden-1.humidity")

# Get subscribed topics
topics = mqtt_client.get_subscribed_topics()
```

### 3. `mqtt_kafka_bridge.py`
**Thay đổi chính:**
- ✅ Support dynamic device configs (Dict[int, DeviceConfig])
- ✅ Thêm `add_device_config()` - Add/update device
- ✅ Thêm `remove_device_config()` - Remove device
- ✅ Topic mapping để lookup nhanh
- ✅ Auto rebuild mapping khi có thay đổi

**API:**
```python
# Add/update device config
bridge.add_device_config(device_id=1, config=DeviceConfig(...))

# Remove device config
bridge.remove_device_config(device_id=1)

# Get all configs
configs = bridge.get_device_configs()
```

### 4. `data-ingestion.py`
**Thay đổi chính:**
- ✅ Load snapshot từ etcd
- ✅ Setup watch với callbacks
- ✅ Dynamic subscribe/unsubscribe MQTT topics
- ✅ Handle PUT events → Subscribe new topics
- ✅ Handle DELETE events → Unsubscribe topics
- ✅ Proper cleanup trong finally block

## 🚀 Cách sử dụng

### Khởi động service

```bash
python data-ingestion.py
```

Service sẽ:
1. Load tất cả device configs từ etcd
2. Subscribe vào các MQTT topics tương ứng
3. Watch cho config changes
4. Tự động subscribe/unsubscribe khi có thay đổi

### Thêm device mới vào etcd

```python
import etcd3
import json

client = etcd3.client(host='localhost', port=2379)

# Add device config
device_config = {
    "mqtt_topic": "garden-1.temperature",
    "sensor_type": "TEMPERATURE",
    "enabled": True
}

client.put(
    '/iot/devices/1',
    json.dumps(device_config)
)
```

**Kết quả:** Service tự động subscribe vào topic `garden-1.temperature`

### Update device config

```python
# Disable device
device_config = {
    "mqtt_topic": "garden-1.temperature",
    "sensor_type": "TEMPERATURE",
    "enabled": False
}

client.put(
    '/iot/devices/1',
    json.dumps(device_config)
)
```

**Kết quả:** Service tự động unsubscribe khỏi topic

### Xóa device

```python
client.delete('/iot/devices/1')
```

**Kết quả:** Service tự động unsubscribe và remove config

## 📊 Data Flow

```
Etcd Config Change
       ↓
Watch Event (PUT/DELETE)
       ↓
Callback Handler
       ↓
Update Bridge Config
       ↓
Subscribe/Unsubscribe MQTT
       ↓
Handle MQTT Messages
       ↓
Forward to Kafka
```

## 🧪 Testing

Chạy example script để test:

```bash
python example_etcd_usage.py
```

Script này sẽ:
1. Load snapshot từ etcd
2. Start watch
3. Display events khi có thay đổi

Trong terminal khác, thử thêm/sửa/xóa configs để xem events.

## 📝 Device Config Format

Mỗi device config trong etcd có format:

```json
{
  "mqtt_topic": "garden-1.humidity",
  "sensor_type": "HUMIDITY",
  "enabled": true
}
```

**Key trong etcd:** `/iot/devices/{device_id}`

Ví dụ:
- `/iot/devices/1` - Device ID 1
- `/iot/devices/2` - Device ID 2
- etc.

## ⚠️ Lưu ý quan trọng

1. **Revision tracking**: Watch bắt đầu từ `revision + 1` sau snapshot để không miss events
2. **Thread-safe**: Watch chạy trong background thread
3. **Enabled flag**: Chỉ subscribe topics có `enabled=true`
4. **Cleanup**: Service tự động cleanup resources khi thoát
5. **Device ID**: Phải là số nguyên, được extract từ etcd key

## 🔍 Logs

Service sẽ log các events:
- ✓ Config snapshot loaded
- ✓ Watch started
- 🔄 Config change detected (PUT)
- 🗑️ Device config deleted (DELETE)
- ✓ Subscribed/Unsubscribed from MQTT topics

## 🎯 Benefits

1. **Dynamic configuration**: Không cần restart service khi thay đổi config
2. **Zero downtime**: Subscribe/unsubscribe topics on-the-fly
3. **Consistent state**: Snapshot + watch đảm bảo không miss updates
4. **Scalable**: Dễ dàng thêm/bớt devices qua etcd
5. **Centralized**: Một source of truth cho configuration

## 🐛 Troubleshooting

### Watch không nhận events
- Check etcd connection
- Verify prefix đúng
- Check etcd logs

### MQTT không subscribe
- Check device `enabled` flag
- Verify MQTT client connected
- Check topic format

### Lỗi parsing config
- Verify JSON format trong etcd
- Check all required fields present
- Check data types match
