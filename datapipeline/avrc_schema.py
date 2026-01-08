
class SensorData:
    def __init__(self, group_name, feed_name, value, sensor_type, timestamp, source):
        self.group_name = group_name
        self.feed_name = feed_name
        self.value = value
        self.sensor_type = sensor_type
        self.timestamp = timestamp
        self.source = source
        
    @staticmethod
    def from_dict(data):
        return SensorData(
            group_name=data.get("group_name"),
            feed_name=data.get("feed_name"),
            value=data.get("value"),
            sensor_type=data.get("sensor_type"),
            timestamp=data.get("timestamp"),
            source=data.get("source")
        )
        
    def to_dict(self):
        return {
            "group_name": self.group_name,
            "feed_name": self.feed_name,
            "value": self.value,
            "sensor_type": self.sensor_type,
            "timestamp": self.timestamp,
            "source": self.source,
        }

    def __str__(self):
        return f"SensorData(group_name={self.group_name}, feed_name={self.feed_name}, value={self.value}, sensor_type={self.sensor_type}, timestamp={self.timestamp}, source={self.source})"
    
    
SENSOR_DATA_SCHEMA = {
    "type": "record",
    "name": "SensorData",
    "namespace": "iot.sensors",
    "fields": [
        {"name": "group_name", "type": "string"},
        {"name": "feed_name", "type": "string"},
        {"name": "value", "type": "double"},
        {"name": "sensor_type", "type": "string"},
        {"name": "timestamp", "type": "long"},
        {"name": "source", "type": "string"}
    ]
}


class ProcessedSensorData:
    def __init__(self, group_name, feed_name, sensor_type, window_start, window_end, source, avg_value, min_value, max_value, count):
        self.group_name = group_name
        self.feed_name = feed_name
        self.sensor_type = sensor_type
        self.window_start = window_start
        self.window_end = window_end
        self.source = source
        self.avg_value = avg_value
        self.min_value = min_value
        self.max_value = max_value
        self.count = count
        
    @staticmethod
    def from_dict(data):
        return ProcessedSensorData(
            group_name=data.get("group_name"),
            feed_name=data.get("feed_name"),
            sensor_type=data.get("sensor_type"),
            window_start=data.get("window_start"),
            window_end=data.get("window_end"),
            source=data.get("source"),
            avg_value=data.get("avg_value"),
            min_value=data.get("min_value"),
            max_value=data.get("max_value"),
            count=data.get("count")
        )
        
    def to_dict(self):
        return {
            "group_name": self.group_name,
            "feed_name": self.feed_name,
            "sensor_type": self.sensor_type,
            "window_start": self.window_start,
            "window_end": self.window_end,
            "source": self.source,
            "avg_value": self.avg_value,
            "min_value": self.min_value,
            "max_value": self.max_value,
            "count": self.count
        }

    def __str__(self):
        return f"ProcessedSensorData(group_name={self.group_name}, feed_name={self.feed_name}, sensor_type={self.sensor_type}, window_start={self.window_start}, window_end={self.window_end}, source={self.source}, avg_value={self.avg_value}, min_value={self.min_value}, max_value={self.max_value}, count={self.count})"

PROCESSED_DATA_SCHEMA = {
    "type": "record",
    "name": "ProcessedSensorData",
    "namespace": "iot.sensors",
    "fields": [
        {"name": "group_name", "type": "string"},
        {"name": "feed_name", "type": "string"},
        {"name": "sensor_type", "type": "string"},
        {"name": "window_start", "type": "long"},
        {"name": "window_end", "type": "long"},
        {"name": "source", "type": "string"},
        {"name": "avg_value", "type": "double"},
        {"name": "min_value", "type": "double"},
        {"name": "max_value", "type": "double"},
        {"name": "count", "type": "int"}
    ]
}