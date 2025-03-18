package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.models.SensorData;
import hcmut.dadn.be.repository.SensorDataRepository;
import hcmut.dadn.be.response.HourlySensorDataResponse;
import hcmut.dadn.be.response.SensorDataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SensorDataService {

    private final SensorDataRepository sensorDataRepository;

    public List<SensorDataResponse> getMoistureLast24Hours() {
        return sensorDataRepository
                .findMoistureLast24Hours(LocalDateTime
                        .now()
                        .minusHours(24))
                .stream()
                .map(SensorDataResponse::fromSensorData).toList();
    }

    public List<SensorDataResponse> getLuxLast24Hours() {
        return sensorDataRepository.findLuxLast24Hours(LocalDateTime.now().minusHours(24)).stream()
                .map(SensorDataResponse::fromSensorData).toList();
    }

    public List<SensorDataResponse> getTemperatureLast24Hours() {
        return sensorDataRepository.findTemperatureLast24Hours(LocalDateTime.now().minusHours(24)).stream()
                .map(SensorDataResponse::fromSensorData).toList();
    }
    
    // Phương thức mới để lấy dữ liệu độ ẩm trung bình theo giờ
    public List<HourlySensorDataResponse> getHourlyMoistureLast24Hours() {
        LocalDateTime fromTime = LocalDateTime.now().minusHours(24);
        List<SensorData> moistureData = sensorDataRepository.findMoistureDataForHourlyAverage(fromTime);
        return calculateHourlyAverage(moistureData, SensorData::getSoilMoisture);
    }
    
    // Phương thức mới để lấy dữ liệu ánh sáng trung bình theo giờ
    public List<HourlySensorDataResponse> getHourlyLuxLast24Hours() {
        LocalDateTime fromTime = LocalDateTime.now().minusHours(24);
        List<SensorData> luxData = sensorDataRepository.findLuxDataForHourlyAverage(fromTime);
        return calculateHourlyAverage(luxData, SensorData::getLux);
    }
    
    // Phương thức mới để lấy dữ liệu nhiệt độ trung bình theo giờ
    public List<HourlySensorDataResponse> getHourlyTemperatureLast24Hours() {
        LocalDateTime fromTime = LocalDateTime.now().minusHours(24);
        List<SensorData> temperatureData = sensorDataRepository.findTemperatureDataForHourlyAverage(fromTime);
        return calculateHourlyAverage(temperatureData, SensorData::getTemperature);
    }
    
    // Phương thức chung để tính trung bình theo giờ
    private List<HourlySensorDataResponse> calculateHourlyAverage(List<SensorData> dataList, 
                                                                 java.util.function.Function<SensorData, Float> valueExtractor) {
        if (dataList.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Nhóm dữ liệu theo giờ
        Map<LocalDateTime, List<Float>> groupedByHour = new HashMap<>();
        
        for (SensorData data : dataList) {
            // Chuẩn hóa thời gian về đầu giờ
            LocalDateTime hourTime = data.getRecordedAt().truncatedTo(ChronoUnit.HOURS);
            Float value = valueExtractor.apply(data);
            
            if (value != null) {
                if (!groupedByHour.containsKey(hourTime)) {
                    groupedByHour.put(hourTime, new ArrayList<>());
                }
                groupedByHour.get(hourTime).add(value);
            }
        }
        
        // Tính trung bình và tạo kết quả
        List<HourlySensorDataResponse> result = new ArrayList<>();
        
        // Xử lý giờ hiện tại chưa hoàn thiện (thêm giờ cập nhật là thời điểm hiện tại)
        LocalDateTime currentHour = LocalDateTime.now().truncatedTo(ChronoUnit.HOURS);
        LocalDateTime now = LocalDateTime.now();
        
        // Tính trung bình cho từng giờ
        for (Map.Entry<LocalDateTime, List<Float>> entry : groupedByHour.entrySet()) {
            LocalDateTime hour = entry.getKey();
            List<Float> values = entry.getValue();
            
            if (!values.isEmpty()) {
                float sum = 0;
                for (Float value : values) {
                    sum += value;
                }
                float average = sum / values.size();
                
                HourlySensorDataResponse response = HourlySensorDataResponse.builder()
                        .value(average)
                        .hour(hour)
                        .build();
                        
                result.add(response);
            }
        }
        
        // Sắp xếp kết quả theo thứ tự thời gian
        return result.stream()
                .sorted((a, b) -> a.getHour().compareTo(b.getHour()))
                .collect(Collectors.toList());
    }
}
