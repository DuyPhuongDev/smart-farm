package hcmut.dadn.be.controller;

import hcmut.dadn.be.response.ApiResponse;
import hcmut.dadn.be.response.PumpHistoryResponse;
import hcmut.dadn.be.service.impl.PumpHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/pump-history")
public class PumpHistoryController {

    private final PumpHistoryService pumpHistoryService;

    // 1️⃣ Lấy tất cả lịch sử bơm
    @GetMapping("")
    public ApiResponse<List<PumpHistoryResponse>> getAllPumpHistory() {
        List<PumpHistoryResponse> responseList = pumpHistoryService.getAllPumpHistory()
                .stream()
                .map(PumpHistoryResponse::fromPumpHistory)
                .collect(Collectors.toList());

        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy lịch sử bơm thành công", responseList);
    }

    // 2️⃣ Lấy lịch sử bơm theo thiết bị (deviceId)
    @GetMapping("/device/{deviceId}")
    public ApiResponse<List<PumpHistoryResponse>> getPumpHistoryByDevice(@PathVariable Long deviceId) {
        List<PumpHistoryResponse> responseList = pumpHistoryService.getPumpHistoryByDevice(deviceId)
                .stream()
                .map(PumpHistoryResponse::fromPumpHistory)
                .collect(Collectors.toList());

        return new ApiResponse<>(HttpStatus.OK.value(), "Lấy lịch sử bơm của thiết bị thành công", responseList);
    }
}
