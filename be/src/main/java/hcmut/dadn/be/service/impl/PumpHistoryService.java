package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.models.PumpHistory;
import hcmut.dadn.be.repository.PumpHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PumpHistoryService {

    private final PumpHistoryRepository pumpHistoryRepository;

    public List<PumpHistory> getAllPumpHistory() {
        return pumpHistoryRepository.findAll();
    }

    public List<PumpHistory> getPumpHistoryByDevice(Long deviceId) {
        return pumpHistoryRepository.findByDevice_DeviceId(deviceId);
    }
}
