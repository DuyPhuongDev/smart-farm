package hcmut.dadn.be.controller;

import hcmut.dadn.be.response.ApiResponse;
import hcmut.dadn.be.response.HourlySensorDataResponse;
import hcmut.dadn.be.response.SensorDataResponse;
import hcmut.dadn.be.service.impl.SensorDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/sensor-data")
@RequiredArgsConstructor
public class SensorDataController {

    private final SensorDataService sensorDataService;

    // // 1️⃣ Lấy độ ẩm trong 24 giờ gần nhất
    // @GetMapping("/humidity")
    // public ApiResponse<List<SensorDataResponse>> getMoistureLast24Hours() {
    //     return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu độ ẩm thành công",
    //             sensorDataService.getMoistureLast24Hours());
    // }

    // // 2️⃣ Lấy ánh sáng trong 24 giờ gần nhất
    // @GetMapping("/lux")
    // public ApiResponse<List<SensorDataResponse>> getLuxLast24Hours() {
    //     return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu ánh sáng thành công",
    //             sensorDataService.getLuxLast24Hours());
    // }

    // // 3️⃣ Lấy nhiệt độ trong 24 giờ gần nhất
    // @GetMapping("/temperature")
    // public ApiResponse<List<SensorDataResponse>> getTemperatureLast24Hours() {
    //     return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu nhiệt độ thành công",
    //             sensorDataService.getTemperatureLast24Hours());
    // }
    
    // 4️⃣ Lấy độ ẩm trung bình theo giờ trong 24 giờ gần nhất
    @GetMapping("/moisture")
    public ApiResponse<List<HourlySensorDataResponse>> getHourlyMoistureLast24Hours() {
        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu độ ẩm trung bình theo giờ thành công",
                sensorDataService.getHourlyMoistureLast24Hours());
    }

    @GetMapping("/humidity")
    public ApiResponse<List<HourlySensorDataResponse>> getHourlyHumidityLast24Hours() {
        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu độ ẩm trung bình theo giờ thành công",
                sensorDataService.getHourlyHumidityLast24Hours());
    }

    // 5️⃣ Lấy ánh sáng trung bình theo giờ trong 24 giờ gần nhất
    @GetMapping("/lux")
    public ApiResponse<List<HourlySensorDataResponse>> getHourlyLuxLast24Hours() {
        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu ánh sáng trung bình theo giờ thành công",
                sensorDataService.getHourlyLuxLast24Hours());
    }

    // 6️⃣ Lấy nhiệt độ trung bình theo giờ trong 24 giờ gần nhất
    @GetMapping("/temperature")
    public ApiResponse<List<HourlySensorDataResponse>> getHourlyTemperatureLast24Hours() {
        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy dữ liệu nhiệt độ trung bình theo giờ thành công",
                sensorDataService.getHourlyTemperatureLast24Hours());
    }
}
