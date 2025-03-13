package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.SensorDataDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.SensorData;

public interface IMLService {
    String predictPumpStatus(SensorDataDTO sensorData) throws DataNotFoundException;
}
