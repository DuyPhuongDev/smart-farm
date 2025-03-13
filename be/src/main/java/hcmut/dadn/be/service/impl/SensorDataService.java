package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.repository.SensorDataRepository;
import hcmut.dadn.be.response.SensorDataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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
}
