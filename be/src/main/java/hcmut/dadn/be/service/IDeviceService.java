package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.request.PumpDTO;
import hcmut.dadn.be.dto.request.SensorDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.dto.response.DeviceResponse;

import java.util.List;

public interface IDeviceService {
    DeviceResponse createSensor(SensorDTO dto) throws DataNotFoundException;

    DeviceResponse createPump(PumpDTO dto) throws DataNotFoundException;

    List<DeviceResponse> getSensorByCurrentUser() throws DataNotFoundException;
    List<DeviceResponse> getPumpByCurrentUser(Long gardenId) throws DataNotFoundException;

}
