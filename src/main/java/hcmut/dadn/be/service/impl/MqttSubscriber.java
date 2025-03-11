package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.models.*;
import hcmut.dadn.be.repository.DeviceRepository;
import hcmut.dadn.be.repository.PumpHistoryRepository;
import hcmut.dadn.be.repository.SensorDataRepository;
import hcmut.dadn.be.service.IExpoNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttSubscriber implements MqttCallback {

    private final MqttClient mqttClient;
    private final SensorDataRepository sensorDataRepository;
    private final PumpHistoryRepository pumpHistoryRepository;
    private final DeviceRepository deviceRepository;
    private final IExpoNotificationService notificationService;
    private final List<SensorData> batchData = new ArrayList<>();
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
        // Tự động kết nối lại
        while (!mqttClient.isConnected()) {
            try {
                Thread.sleep(5000);  // Đợi 5 giây rồi thử kết nối lại
                mqttClient.reconnect();
                log.info("🔄 Đã kết nối lại MQTT thành công!");
            } catch (Exception e) {
                log.error("⚠️ Lỗi khi kết nối lại MQTT: {}", e.getMessage());
            }
        }
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
                // send notify
                if (Float.parseFloat(payload) > 40) {
                    sendNotificationToUser(device, Float.parseFloat(payload));
                }
            } else if (feedName.contains("humidity")) {
                sensorData.setSoilMoisture(Float.parseFloat(payload)); // Độ ẩm đất
            } else if (feedName.contains("lux")) {
                sensorData.setLux(Float.parseFloat(payload)); // Cường độ ánh sáng
            } else {
                log.warn("⚠️ Feed không xác định, bỏ qua dữ liệu: {}", feedName);
                return;
            }

            // Thêm data vào batch
            synchronized (batchData) {
                batchData.add(sensorData);
            }
            log.info("✅ Dữ liệu cảm biến đã lưu vào DB: {}", sensorData);

        } catch (Exception e) {
            log.error("❌ Lỗi khi xử lý dữ liệu MQTT: ", e);
        }
    }

    @Scheduled(fixedRate = 60000) // Mỗi 60s lưu dữ liệu 1 lần
    public void batchSaveSensorData() {
        if (!batchData.isEmpty()) {
            sensorDataRepository.saveAll(new ArrayList<>(batchData));
            log.info("✅ Batch insert {} sensor data vào DB", batchData.size());
            batchData.clear();
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Không cần xử lý vì chỉ subscribe
    }

    private void sendNotificationToUser(Device device, float temperature) {
        List<UserDeviceToken> deviceTokens = device.getUser().getDeviceTokens(); // Lấy token từ user
        if (deviceTokens == null || deviceTokens.isEmpty()) {
            log.warn("⚠️ Không tìm thấy deviceToken cho user: {}", device.getUser().getId());
            return;
        }

        String title = "⚠️ Cảnh báo nhiệt độ cao!";
        String body = "Thiết bị " + device.getDeviceName() + " báo nhiệt độ " + temperature + "°C.";

        for (UserDeviceToken deviceToken : deviceTokens) {
            notificationService.sendNotification(deviceToken.getDeviceToken(), title, body);
        }
    }

}
