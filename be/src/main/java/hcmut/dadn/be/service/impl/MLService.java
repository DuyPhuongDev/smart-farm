package hcmut.dadn.be.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import hcmut.dadn.be.dto.SensorDataDTO;
import hcmut.dadn.be.exception.DataNotFoundException;
import hcmut.dadn.be.models.SensorData;
import hcmut.dadn.be.service.IMLService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MLService implements IMLService {
    @Value("${predict.api.url}")
    private String PREDICT_API;

    @Override
    public String predictPumpStatus(SensorDataDTO data) throws DataNotFoundException {
        try {

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Tạo request body JSON
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("humidity", data.getHumidity());
            requestBody.put("temperature", data.getTemperature());
            requestBody.put("moisture", data.getMoisture());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(PREDICT_API, request, String.class);

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("pump_status").asText(); // Lấy giá trị "pump_status"

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
}
