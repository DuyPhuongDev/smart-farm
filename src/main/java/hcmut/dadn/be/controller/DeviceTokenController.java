package hcmut.dadn.be.controller;

import hcmut.dadn.be.dto.DeviceTokenDTO;
import hcmut.dadn.be.response.ApiResponse;
import hcmut.dadn.be.service.IUserDeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${api.prefix}/device-tokens")
@RequiredArgsConstructor
public class DeviceTokenController {
    private final IUserDeviceTokenService userDeviceTokenService;

    @PostMapping("/token")
    public ApiResponse<?> saveDeviceToken(@RequestBody DeviceTokenDTO request) {
        return new ApiResponse<>(HttpStatus.CREATED.value(), "Save token success!", userDeviceTokenService.addNewToken(request));
    }
}
