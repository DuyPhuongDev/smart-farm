package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.dto.DeviceTokenDTO;
import hcmut.dadn.be.exception.DataAlreadyExistsException;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.User;
import hcmut.dadn.be.models.UserDeviceToken;
import hcmut.dadn.be.repository.UserDeviceTokenRepository;
import hcmut.dadn.be.repository.UserRepository;
import hcmut.dadn.be.response.DeviceTokenResponse;
import hcmut.dadn.be.service.IUserDeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class UserDeviceService implements IUserDeviceTokenService {
    private final UserRepository userRepository;
    private final UserDeviceTokenRepository deviceTokenRepository;

    @Override
    public DeviceTokenResponse addNewToken(DeviceTokenDTO request) throws DataNotFoundException, DataAlreadyExistsException {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new DataNotFoundException("User not found"));

        if(deviceTokenRepository.existsByUser(user)) throw new DataAlreadyExistsException("Device token already exists");

        UserDeviceToken deviceToken = new UserDeviceToken();
        deviceToken.setUser(user);
        deviceToken.setDeviceToken(request.getDeviceToken());
        if (user.getDeviceTokens()==null) user.setDeviceTokens(new ArrayList<>());
        user.getDeviceTokens().add(deviceToken);
        userRepository.save(user);
        return DeviceTokenResponse.fromToken(deviceToken);
    }
}
