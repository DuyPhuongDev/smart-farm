# Schema Migration Guide - Fixing Incompatibility Issues

## 🚨 Vấn đề

Bạn gặp lỗi:
```
SchemaRegistryError: Schema being registered is incompatible with an earlier schema
errorType: 'READER_FIELD_MISSING_DEFAULT_VALUE'
```

**Nguyên nhân:**
Schema đã thay đổi từ:
```json
// Old Schema (v1)
{
  "group_name": "string",
  "feed_name": "string",
  "value": "double",
  "sensor_type": "string",
  "timestamp": "long",
  "source": "string"
}
```

Thành:
```json
// New Schema (v2)
{
  "device_id": "int",      // ← NEW, no default
  "value": "double",
  "sensor_type": "string",
  "timestamp": "long",
  "source": "string"
}
```

**Vấn đề:**
- Thêm field `device_id` mới không có default value
- Xóa fields `group_name` và `feed_name`
- Vi phạm BACKWARD compatibility

## ✅ Giải pháp (Recommended cho DEV/TEST)

### Bước 1: List schemas hiện có

```bash
python reset_schema_registry.py list
```

Output:
```
Found 2 subjects:
  - iot.sensor.raw.v1-value
  - iot.sensor.raw.v1-key
```

### Bước 2: Check versions của subject

```bash
python reset_schema_registry.py versions --subject iot.sensor.raw.v1-value
```

Output:
```
Subject 'iot.sensor.raw.v1-value' has 1 version(s): [1]

  Version 1:
    ID: 1
    Schema: {"type":"record","name":"SensorData",...}
```

### Bước 3: Xóa schema cũ (⚠️ Chỉ dùng trong DEV/TEST!)

```bash
python reset_schema_registry.py delete --subject iot.sensor.raw.v1-value
```

Confirm với `yes`:
```
⚠️  You are about to DELETE subject: iot.sensor.raw.v1-value
⚠️  This will remove ALL versions of this schema!

Type 'yes' to confirm: yes
```

Output:
```
✓ Soft deleted subject 'iot.sensor.raw.v1-value' (versions: [1])
✓ Permanently deleted subject 'iot.sensor.raw.v1-value' (versions: [1])
```

### Bước 4: Restart service

```bash
python data-ingestion.py
```

Service sẽ tự động register schema mới!

## 🔧 Script Usage

### List all subjects
```bash
python reset_schema_registry.py list
```

### Show versions of a subject
```bash
python reset_schema_registry.py versions --subject iot.sensor.raw.v1-value
```

### Delete a subject
```bash
python reset_schema_registry.py delete --subject iot.sensor.raw.v1-value
```

### Use custom Schema Registry URL
```bash
python reset_schema_registry.py list --url http://localhost:8081
```

## 📊 Schema Evolution Strategies

### Strategy 1: Delete & Re-register (Current approach)
**Pros:**
- ✅ Đơn giản, nhanh chóng
- ✅ Phù hợp cho dev/test

**Cons:**
- ❌ Mất data compatibility
- ❌ KHÔNG dùng production

**When to use:** Development, testing, breaking changes

### Strategy 2: Backward Compatible Evolution
**Approach:** Thêm fields mới với default values

```python
SENSOR_DATA_SCHEMA = {
    "fields": [
        {"name": "group_name", "type": "string"},
        {"name": "feed_name", "type": "string"},
        {"name": "value", "type": "double"},
        {"name": "sensor_type", "type": "string"},
        {"name": "timestamp", "type": "long"},
        {"name": "source", "type": "string"},
        {"name": "device_id", "type": "int", "default": 0}  # ← NEW with default
    ]
}
```

**Pros:**
- ✅ Backward compatible
- ✅ Old consumers vẫn work
- ✅ Safe cho production

**Cons:**
- ❌ Phải keep old fields (group_name, feed_name)
- ❌ Schema phình to

**When to use:** Production, need backward compatibility

### Strategy 3: New Topic/Subject
**Approach:** Dùng topic name mới

```python
# Old
kafka_topic = "iot.sensor.raw.v1"

# New
kafka_topic = "iot.sensor.raw.v2"  # ← New topic
```

**Pros:**
- ✅ Tách biệt hoàn toàn old/new schema
- ✅ Migrate dần dần
- ✅ Rollback dễ dàng

**Cons:**
- ❌ Phải maintain 2 topics
- ❌ Consumer phải subscribe 2 topics

**When to use:** Major schema changes, gradual migration

### Strategy 4: Change Compatibility Mode
**Approach:** Đổi compatibility mode của Schema Registry

```bash
# Check current mode
curl http://localhost:8081/config

# Change to NONE (allow any change)
curl -X PUT -H "Content-Type: application/json" \
  --data '{"compatibility":"NONE"}' \
  http://localhost:8081/config/iot.sensor.raw.v1-value
```

**Compatibility Modes:**
- `BACKWARD`: New schema, old consumers ✅
- `FORWARD`: Old schema, new consumers ✅
- `FULL`: Both backward + forward ✅✅
- `NONE`: No checks ⚠️

**Pros:**
- ✅ Flexible
- ✅ Không cần xóa schema

**Cons:**
- ❌ Có thể break consumers
- ❌ NGUY HIỂM trong production

**When to use:** Biết rõ impact, controlled environment

## 🎯 Recommended Approach

### For DEV/TEST:
1. ✅ **Delete & Re-register** (Strategy 1)
2. Fast iteration, no baggage
3. Use `reset_schema_registry.py`

### For PRODUCTION:
1. ✅ **New Topic** (Strategy 3) cho breaking changes
2. ✅ **Backward Compatible** (Strategy 2) cho minor changes
3. Never delete production schemas!

## 🔍 Debugging Schema Issues

### Check what schema is registered
```bash
curl http://localhost:8081/subjects/iot.sensor.raw.v1-value/versions/1 | jq
```

### Check compatibility mode
```bash
curl http://localhost:8081/config/iot.sensor.raw.v1-value | jq
```

### Test compatibility before registering
```bash
curl -X POST -H "Content-Type: application/json" \
  --data @new_schema.json \
  http://localhost:8081/compatibility/subjects/iot.sensor.raw.v1-value/versions/latest
```

Response:
```json
{
  "is_compatible": false
}
```

## 📚 Best Practices

1. **Dev/Test:**
   - Xóa schemas thoải mái khi cần
   - Iterate nhanh
   - Use `reset_schema_registry.py`

2. **Staging:**
   - Test schema migrations
   - Verify compatibility
   - Simulate production scenario

3. **Production:**
   - NEVER delete schemas
   - Always add fields with defaults
   - Use new topics for breaking changes
   - Plan migration carefully

## ⚠️ Warnings

1. **NEVER** xóa schemas trong production!
2. **ALWAYS** test schema changes trong dev/staging trước
3. **BACKUP** data trước khi schema migration
4. **PLAN** rollback strategy

## 🆘 Troubleshooting

### Issue: Delete fails with 404
**Reason:** Subject already deleted or doesn't exist

**Solution:** Check với `list` command trước

### Issue: Schema still shows old version after delete
**Reason:** Chưa permanent delete

**Solution:** Script tự động làm cả soft + permanent delete

### Issue: Kafka consumer fails after schema change
**Reason:** Consumer có cached schema cũ

**Solution:** Restart consumer application

### Issue: Multiple subjects need deletion
**Solution:** Xóa từng subject một:
```bash
python reset_schema_registry.py delete --subject iot.sensor.raw.v1-value
python reset_schema_registry.py delete --subject iot.sensor.raw.v1-key
```

## 📖 References

- [Confluent Schema Registry Docs](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [Avro Schema Evolution](https://avro.apache.org/docs/current/spec.html#Schema+Resolution)
- [Schema Compatibility Types](https://docs.confluent.io/platform/current/schema-registry/avro.html#compatibility-types)
