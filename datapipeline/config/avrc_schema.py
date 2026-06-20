class SensorData:
    def __init__(self, device_id, value, sensor_type, timestamp, source):
        self.device_id = device_id
        self.value = value
        self.sensor_type = sensor_type
        self.timestamp = timestamp
        self.source = source
        
    @staticmethod
    def from_dict(data: dict):
        return SensorData(
            device_id=data.get("device_id"),
            value=data.get("value"),
            sensor_type=data.get("sensor_type"),
            timestamp=data.get("timestamp"),
            source=data.get("source")
        )
        
    def to_dict(self):
        return {
            "device_id": self.device_id,
            "value": self.value,
            "sensor_type": self.sensor_type,
            "timestamp": self.timestamp,
            "source": self.source,
        }

    def __str__(self):
        return f"SensorData(device_id={self.device_id}, value={self.value}, sensor_type={self.sensor_type}, timestamp={self.timestamp}, source={self.source})"
    
    
SENSOR_DATA_SCHEMA = {
    "type": "record",
    "name": "SensorData",
    "namespace": "iot.sensors",
    "fields": [
        {"name": "device_id", "type": "int"},
        {"name": "value", "type": "double"},
        {"name": "sensor_type", "type": "string"},
        {"name": "timestamp", "type": "long"},
        {"name": "source", "type": "string"}
    ]
}


class ProcessedSensorData:
    def __init__(self, device_id, sensor_type, window_start, window_end, avg_value, min_value, max_value, count):
        self.device_id = device_id
        self.sensor_type = sensor_type
        self.window_start = window_start
        self.window_end = window_end
        self.avg_value = avg_value
        self.min_value = min_value
        self.max_value = max_value
        self.count = count
        
    @staticmethod
    def from_dict(data: dict):
        return ProcessedSensorData(
            device_id=data.get("device_id"),
            sensor_type=data.get("sensor_type"),
            window_start=data.get("window_start"),
            window_end=data.get("window_end"),
            avg_value=data.get("avg_value"),
            min_value=data.get("min_value"),
            max_value=data.get("max_value"),
            count=data.get("count")
        )
        
    def to_dict(self):
        return {
            "device_id": self.device_id,
            "sensor_type": self.sensor_type,
            "window_start": self.window_start,
            "window_end": self.window_end,
            "avg_value": self.avg_value,
            "min_value": self.min_value,
            "max_value": self.max_value,
            "count": self.count
        }

    def __str__(self):
        return f"ProcessedSensorData(device_id={self.device_id}, sensor_type={self.sensor_type}, window_start={self.window_start}, window_end={self.window_end}, avg_value={self.avg_value}, min_value={self.min_value}, max_value={self.max_value}, count={self.count})"

PROCESSED_DATA_SCHEMA = {
    "type": "record",
    "name": "ProcessedSensorData",
    "namespace": "iot.sensors",
    "fields": [
        {"name": "device_id", "type": "int"},
        {"name": "sensor_type", "type": "string"},
        {"name": "window_start", "type": "long"},
        {"name": "window_end", "type": "long"},
        {"name": "avg_value", "type": "double"},
        {"name": "min_value", "type": "double"},
        {"name": "max_value", "type": "double"},
        {"name": "count", "type": "int"}
    ]
}