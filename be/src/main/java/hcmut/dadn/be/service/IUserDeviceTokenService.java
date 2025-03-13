package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.DeviceTokenDTO;
import hcmut.dadn.be.exception.DataAlreadyExistsException;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.response.DeviceTokenResponse;

public interface IUserDeviceTokenService {
    DeviceTokenResponse addNewToken(DeviceTokenDTO request) throws DataNotFoundException, DataAlreadyExistsException;
}
