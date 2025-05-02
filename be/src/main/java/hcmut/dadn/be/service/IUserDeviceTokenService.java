package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.request.DeviceTokenDTO;
import hcmut.dadn.be.exception.DataAlreadyExistsException;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.dto.response.DeviceTokenResponse;

public interface IUserDeviceTokenService {
    DeviceTokenResponse addNewToken(DeviceTokenDTO request) throws DataNotFoundException, DataAlreadyExistsException;
}
