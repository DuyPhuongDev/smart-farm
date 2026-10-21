# Etcd Watch Modes: History Replay vs New Events Only

## 🤔 Vấn đề bạn gặp phải

**Triệu chứng:** 
Khi start service, bạn thấy nhận được events cũ (PUT/DELETE) của device đã xóa trước đó.

```
2026-01-11 23:33:28 | INFO | PUT event for device: 4
2026-01-11 23:33:28 | INFO | DELETE event for device: 4
```

**Nguyên nhân:**
Etcd watch với `start_revision` sẽ **replay tất cả events từ revision đó đến hiện tại**.

## 📊 Timeline minh họa

```
Time ──────────────────────────────────────────────>

[Revision 4]  [Revision 5]  [Revision 6]  [Now]
Snapshot       PUT device 4  DELETE dev 4  Service starts
(3 devices)                                 ↓
                                           Watch from revision 5
                                           → Replay PUT (rev 5)
                                           → Replay DELETE (rev 6)
```

## 🔧 Hai Modes

### Mode 1: **New Events Only** (Default - Recommended)
```python
etcd_config_manager.watch_config_changes(
    on_put=handle_put,
    on_delete=handle_delete,
    prefix='/iot/devices/',
    replay_history=False  # ← Default
)
```

**Behavior:**
- ✅ Chỉ nhận events MỚI sau khi watch start
- ✅ Bỏ qua tất cả historical events
- ✅ Service chỉ react với changes xảy ra TRONG thời gian running

**Timeline:**
```
[Snapshot]  [Watch Start]  [New Event]
   ↓            ↓              ↓
Load 3      Watch from     Receive PUT device 5
devices     NOW            → Handle it!
            ↓
            Ignore old events
```

**Use case:** 
- Normal operation
- Bạn chỉ quan tâm config changes TRONG khi service đang chạy
- Snapshot đã có đủ current state

### Mode 2: **With History Replay**
```python
etcd_config_manager.watch_config_changes(
    on_put=handle_put,
    on_delete=handle_delete,
    prefix='/iot/devices/',
    replay_history=True  # ← Enable replay
)
```

**Behavior:**
- ✅ Replay TẤT CẢ events từ snapshot revision + 1
- ✅ Sau khi replay xong, tiếp tục watch new events
- ⚠️ Có thể nhận events cũ (như PUT rồi DELETE ngay)

**Timeline:**
```
[Revision 4]  [Revision 5]  [Revision 6]  [Now]
Snapshot       PUT dev 4     DELETE dev 4  Watch Start
   ↓              ↓              ↓            ↓
Load 3 devs    ← ← ← ← ← ← ← ← ← ← ← ← ← Replay
                                            from rev 5
                                            ↓
                                        Receive PUT dev 4
                                        Receive DELETE dev 4
                                        (Even though dev 4 already gone)
```

**Use case:**
- Đảm bảo KHÔNG MISS bất kỳ event nào
- Crash recovery - service bị down rồi start lại
- Audit trail - cần track mọi thay đổi

## 🎯 So sánh

| Aspect | New Events Only | With History Replay |
|--------|----------------|-------------------|
| **Default** | ✅ Yes | ❌ No |
| **Replay old events** | ❌ No | ✅ Yes |
| **Noise from past** | ✅ Clean | ⚠️ Can be noisy |
| **Event guarantee** | New only | ALL events |
| **Performance** | 🚀 Fast | 🐢 Slower (if many historical events) |
| **Use case** | Normal ops | Crash recovery, audit |

## 🔍 Chi tiết kỹ thuật

### New Events Only (replay_history=False)
```python
# In etcd_config_manager.py
start_revision = None  # Watch from NOW
events_iterator, cancel = self.client.watch_prefix(
    prefix, 
    start_revision=None  # ← Etcd sẽ chỉ return events MỚI
)
```

### With History Replay (replay_history=True)
```python
# In etcd_config_manager.py
start_revision = self.last_revision + 1  # Watch from snapshot + 1
events_iterator, cancel = self.client.watch_prefix(
    prefix, 
    start_revision=5  # ← Etcd sẽ replay từ revision 5 đến hiện tại
)
```

## 📝 Ví dụ thực tế

### Scenario 1: Normal Development
**Tình huống:**
- Service đang chạy
- Bạn add device mới qua etcd
- Service nhận event và subscribe

**Nên dùng:** `replay_history=False`

```python
# Service running...
# User adds device 5 to etcd
# → Service receives PUT event
# → Subscribe to new topic
# ✓ Clean and simple
```

### Scenario 2: Service Restart
**Tình huống:**
- Service đã chạy 1 giờ
- Trong thời gian đó có 10 config changes
- Service bị restart
- Snapshot load current state (đã bao gồm tất cả changes)

**Nên dùng:** `replay_history=False`

```python
# Snapshot already has latest state
# No need to replay 10 changes
# Just watch for NEW changes from now
# ✓ Efficient
```

### Scenario 3: Audit/Compliance
**Tình huống:**
- Cần track MỌI config change
- Cần log đầy đủ audit trail
- Service restart không được miss events

**Nên dùng:** `replay_history=True`

```python
# Replay all events to ensure complete audit
# Log every PUT/DELETE for compliance
# ✓ Guaranteed no missed events
```

## 🐛 Troubleshooting

### Vấn đề: Nhận duplicate subscriptions
**Triệu chứng:**
```
✓ Subscribed to topic: garden-1.humidity
✓ Subscribed to topic: garden-1.humidity  # ← Duplicate!
```

**Nguyên nhân:** `replay_history=True` với device đã có trong snapshot

**Giải pháp:**
1. Dùng `replay_history=False` (recommended)
2. Hoặc check duplicate trong callback:
```python
def on_device_added(device_id, config):
    if device_id in current_subscriptions:
        logger.debug(f"Device {device_id} already subscribed, skipping")
        return
    # ... subscribe logic
```

### Vấn đề: Events cũ gây confusion
**Triệu chứng:**
```
PUT device 4   # Device thêm lúc 10:00
DELETE device 4  # Device xóa lúc 10:05
Service start lúc 11:00 → Nhận cả 2 events
```

**Giải pháp:** Dùng `replay_history=False`

## ✅ Best Practices

1. **Default to `replay_history=False`** cho hầu hết use cases
2. Chỉ dùng `replay_history=True` khi:
   - Cần đảm bảo không miss events (crash recovery)
   - Cần audit trail đầy đủ
   - Có logic xử lý duplicate/outdated events

3. Snapshot đã cung cấp current state → Không cần replay history

4. Nếu cần replay history, handle idempotency:
   ```python
   def on_device_added(device_id, config):
       # Check if already exists
       if device_id in bridge.get_device_configs():
           # Update instead of add
           pass
   ```

## 🔄 Migration

Nếu code cũ dùng `replay_history=True` (implicit), giờ muốn đổi:

```python
# Before (implicitly replay history)
etcd_config_manager.watch_config_changes(
    on_put=handle_put,
    on_delete=handle_delete,
    prefix='/iot/devices/'
)

# After (explicitly new events only)
etcd_config_manager.watch_config_changes(
    on_put=handle_put,
    on_delete=handle_delete,
    prefix='/iot/devices/',
    replay_history=False  # ← Add this
)
```

**Impact:** Service sẽ không còn nhận historical events nữa

**Testing:** Start/stop service nhiều lần, verify không nhận old events

## 📚 Tham khảo

- Etcd watch API: https://etcd.io/docs/v3.5/learning/api/#watch-api
- `start_revision`: Nếu set, etcd replay từ revision đó đến hiện tại
- `start_revision=None`: Etcd chỉ return events mới từ thời điểm watch
