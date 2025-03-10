package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.DeviceDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.Device;
import hcmut.dadn.be.repository.DeviceRepository;
import hcmut.dadn.be.response.DeviceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeviceService implements IDeviceService{
    private final DeviceRepository deviceRepository;
    private final UserService userService;
    private final MqttClient mqttClient;

    @Value("${AIO_USERNAME}")
    private String username;
    @Override
    public DeviceResponse createDevice(DeviceDTO deviceDTO) throws MqttException {

        Device device = Device.builder()
                .deviceName(deviceDTO.getName())
                .feed(deviceDTO.getFeed())
                .location(deviceDTO.getLocation())
                .user(userService.getLoggedUser())
                .build();
        deviceRepository.save(device);
        mqttClient.subscribe(username+device.getFeed());
        log.info("Đã subscribe feed: " + device.getFeed());
        return DeviceResponse.fromDevice(device);
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
