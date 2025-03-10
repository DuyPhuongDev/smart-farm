package hcmut.dadn.be.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import hcmut.dadn.be.models.Device;
import hcmut.dadn.be.models.PumpAction;
import hcmut.dadn.be.models.PumpHistory;
import hcmut.dadn.be.models.SensorData;
import hcmut.dadn.be.repository.DeviceRepository;
import hcmut.dadn.be.repository.PumpHistoryRepository;
import hcmut.dadn.be.repository.SensorDataRepository;
import hcmut.dadn.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttSubscriber implements MqttCallback {

    private final MqttClient mqttClient;
    private final SensorDataRepository sensorDataRepository;
    private final PumpHistoryRepository pumpHistoryRepository;
    private final DeviceRepository deviceRepository;
    @Value("${AIO_USERNAME}")
    private String username;

    @EventListener(ContextRefreshedEvent.class)
    public void subscribe() throws Exception {
        List<String> feeds = deviceRepository.findAllFeeds();
        mqttClient.setCallback(this);
        for(String feed: feeds){
            mqttClient.subscribe(username+feed);
            log.info("Đã subscribe feed: " + feed);
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        System.err.println("❌ Mất kết nối MQTT: " + cause.getMessage());
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        try {
            String payload = new String(message.getPayload()).trim(); // Loại bỏ khoảng trắng dư thừa
            log.info("📥 Nhận dữ liệu từ topic: {} - Payload: {}", topic, payload);

            // 1️⃣ Tìm thiết bị dựa trên topic
            String feedName = topic.replace(username, ""); // Loại bỏ username để lấy feed
            Device device = deviceRepository.findByFeed(feedName);
            if (device == null) {
                log.warn("⚠️ Không tìm thấy thiết bị với feed: {}", feedName);
                return;
            }

            // 2️⃣ Kiểm tra nếu là feed "pump", cập nhật vào bảng PumpHistory
            if (feedName.contains("pump")) {
                PumpHistory pumpHistory = new PumpHistory();
                pumpHistory.setDevice(device);
                pumpHistory.setTimestamp(LocalDateTime.now());

                // Xác định trạng thái ON/OFF từ payload
                if (payload.equalsIgnoreCase("ON")) {
                    pumpHistory.setAction(PumpAction.ON);
                } else if (payload.equalsIgnoreCase("OFF")) {
                    pumpHistory.setAction(PumpAction.OFF);
                } else {
                    log.warn("⚠️ Dữ liệu pump không hợp lệ: {}", payload);
                    return;
                }

                // Lưu vào database
                pumpHistoryRepository.save(pumpHistory);
                log.info("✅ Đã cập nhật trạng thái bơm: {}", pumpHistory);
                return;
            }

            // 3️⃣ Nếu không phải pump, thì lưu vào bảng SensorData
            SensorData sensorData = new SensorData();
            sensorData.setDevice(device);
            sensorData.setRecordedAt(LocalDateTime.now()); // Ghi lại thời gian nhận

            // Xác định loại dữ liệu theo feedName
            if (feedName.contains("temperature")) {
                sensorData.setTemperature(Float.parseFloat(payload)); // Dữ liệu nhiệt độ
            } else if (feedName.contains("humidity")) {
                sensorData.setSoilMoisture(Float.parseFloat(payload)); // Độ ẩm đất
            } else if (feedName.contains("lux")) {
                sensorData.setLux(Float.parseFloat(payload)); // Cường độ ánh sáng
            } else {
                log.warn("⚠️ Feed không xác định, bỏ qua dữ liệu: {}", feedName);
                return;
            }

            // Lưu dữ liệu vào database
            sensorDataRepository.save(sensorData);
            log.info("✅ Dữ liệu cảm biến đã lưu vào DB: {}", sensorData);

        } catch (Exception e) {
            log.error("❌ Lỗi khi xử lý dữ liệu MQTT: ", e);
        }
    }



    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Không cần xử lý vì chỉ subscribe
    }
}
