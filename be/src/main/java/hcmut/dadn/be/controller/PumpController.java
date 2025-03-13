package hcmut.dadn.be.controller;

import hcmut.dadn.be.dto.SensorDataDTO;
import hcmut.dadn.be.models.SensorData;
import org.springframework.web.bind.annotation.*;
import java.io.*;

@RestController
@RequestMapping("${api.prefix}/pump")
public class PumpController {

    @PostMapping("/predict")
    public String predictPumpStatus(@RequestBody SensorDataDTO data) {
        try {
            // Gọi Python để dự đoán
            ProcessBuilder pb = new ProcessBuilder("python3", "predict.py",
                    String.valueOf(data.getHumidity()),
                    String.valueOf(data.getTemperature()),
                    String.valueOf(data.getMoisture()));

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            return reader.readLine();  // Nhận kết quả từ Python
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
}
