package hcmut.dadn.be.controller;

import hcmut.dadn.be.dto.DeviceDTO;
import hcmut.dadn.be.response.ApiResponse;
import hcmut.dadn.be.service.IDeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/devices")
public class DeviceController {
    private final IDeviceService iDeviceService;

    @PostMapping("/create")
    public ApiResponse<?> createDevice(@RequestBody DeviceDTO deviceDTO) {
        try {
            return new ApiResponse<>(HttpStatus.CREATED.value(), "Create Success!", iDeviceService.createDevice(deviceDTO));
        }catch (Exception e) {
            return new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @GetMapping("")
    public ApiResponse<?> getAllDevices() {
        try {
            return new ApiResponse<>(HttpStatus.OK.value(), "Get All Success!", iDeviceService.getAllDevices());
        }catch (Exception e) {
            return new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getDeviceById(@PathVariable("id") Long id) {
        try {
            return new ApiResponse<>(HttpStatus.OK.value(), "Get Success!", iDeviceService.getDeviceById(id));
        }catch (Exception e) {
            return new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }
}
