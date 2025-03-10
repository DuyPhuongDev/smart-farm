package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.DeviceDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.Device;
import hcmut.dadn.be.repository.DeviceRepository;
import hcmut.dadn.be.response.DeviceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService implements IDeviceService{
    private final DeviceRepository deviceRepository;
    private final UserService userService;
    @Override
    public DeviceResponse createDevice(DeviceDTO deviceDTO) {
        return DeviceResponse.fromDevice(deviceRepository.save(Device.builder()
                .deviceName(deviceDTO.getName())
                .feed(deviceDTO.getFeed())
                .location(deviceDTO.getLocation())
                .user(userService.getLoggedUser())
                .build()));
    }

    @Override
    public String findFeedByDeviceId(Long deviceId) {
        Device device = deviceRepository.findById(deviceId).orElseThrow(()-> new DataNotFoundException("Device not found"));
        return device.getFeed();
    }

    @Override
    public DeviceResponse getDeviceById(Long deviceId) {
        Device device = deviceRepository.findById(deviceId).orElseThrow(()-> new DataNotFoundException("Device not found"));
        return DeviceResponse.fromDevice(device);
    }

    @Override
    public List<DeviceResponse> getAllDevices() {
        List<Device> devices = deviceRepository.findAll();
        return devices.stream().map(DeviceResponse::fromDevice).toList();
    }
}
