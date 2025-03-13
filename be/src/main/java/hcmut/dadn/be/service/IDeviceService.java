package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.DeviceDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.Device;
import hcmut.dadn.be.response.DeviceResponse;
import org.eclipse.paho.client.mqttv3.MqttException;

import java.util.List;

public interface IDeviceService {
    DeviceResponse createDevice(DeviceDTO deviceDTO) throws MqttException;

    String findFeedByDeviceId(Long deviceId) throws DataNotFoundException;

    DeviceResponse getDeviceById(Long deviceId) throws DataNotFoundException;

    List<DeviceResponse> getAllDevices();

}
