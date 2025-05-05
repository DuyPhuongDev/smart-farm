package hcmut.dadn.be.service.impl;

import hcmut.dadn.be.dto.request.NotificationRequest;
import hcmut.dadn.be.models.data.PumpAction;
import hcmut.dadn.be.models.data.PumpHistory;
import hcmut.dadn.be.models.data.SensorData;
import hcmut.dadn.be.models.device.Device;
import hcmut.dadn.be.models.device.DeviceType;
import hcmut.dadn.be.models.notification.UserDeviceToken;
import hcmut.dadn.be.repository.DeviceRepository;
import hcmut.dadn.be.repository.PumpHistoryRepository;
import hcmut.dadn.be.repository.SensorDataRepository;
import hcmut.dadn.be.repository.GardenRepository;
import hcmut.dadn.be.service.IExpoNotificationService;
import hcmut.dadn.be.util.DeviceCache;
import hcmut.dadn.be.util.SensorDataBatchSaver;
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
   private final SensorDataBatchSaver sensorDataBatchSaver;
   private final DeviceCache deviceCache;
   private final PumpHistoryRepository pumpHistoryRepository;
   private final DeviceRepository deviceRepository;
   private final IExpoNotificationService notificationService;

   @Value("${AIO_USERNAME}")
   private String username;

   @EventListener(ContextRefreshedEvent.class)
    public void subscribe() throws Exception {
        mqttClient.setCallback(this);

        // Lấy toàn bộ tên feed từ repository (bao gồm group.feed format)
        List<Device> devices = deviceRepository.findAll();
        List<String> feeds = devices.stream().map(d -> d.getGarden().getGroupName() + "." + d.getFeedName()).toList();

        for (String feed : feeds) {
            String fullTopic = username + "/feeds/" + feed;  // feed có thể là "group.feed" hoặc chỉ "feed"
            mqttClient.subscribe(fullTopic);
            log.info("Đã subscribe feed: " + fullTopic);
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

           // Xóa username và phần feeds/ từ topic để lấy feedName and groupName
           String feedPath = topic.replace(username + "/feeds/", "");
           // data[0]: groupName, data[1]: feedName
           String[] data = feedPath.split("\\.");

           Device device = null;
           // Tìm thiết bị dựa trên groupName và feedName
            device = deviceCache.getDevice(data[0], data[1]);
           log.info("Tìm thiết bị với groupName={}, feedName={}", data[0], data[1]);

            // Kiểm tra nếu không tìm thấy thiết bị
            if (device == null) {
                log.warn("⚠️ Không tìm thấy thiết bị với feed path: {}", feedPath);
                return;
            }

            // Xác định loại thiết bị và lưu dữ liệu phù hợp
            if (device.getDeviceType() == DeviceType.PUMP) {
                PumpHistory pumpHistory = PumpHistory.builder()
                        .device(device)
                        .build();

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

           // Nếu không phải pump → đẩy vào batch saver
           SensorData sensorData = SensorData.builder()
                   .device(device)
                   .value(Float.parseFloat(payload))
                   .build();

           sensorDataBatchSaver.addSensorData(sensorData);

       } catch (Exception e) {
           log.error("❌ Lỗi khi xử lý dữ liệu MQTT: ", e);
       }
   }

   @Override
   public void deliveryComplete(IMqttDeliveryToken token) {
       // Không cần xử lý vì chỉ subscribe
   }

   private void sendNotificationToUser(Device device, String title, String body) {
       if (device.getGarden() == null || device.getGarden().getUser() == null) {
           log.warn("⚠️ Thiết bị {} không có garden hoặc user", device.getDeviceName());
           return;
       }
       
       List<UserDeviceToken> deviceTokens = device.getGarden().getUser().getDeviceTokens();
       if (deviceTokens == null || deviceTokens.isEmpty()) {
           log.warn("⚠️ Không tìm thấy deviceToken cho user: {}", device.getGarden().getUser().getId());
           return;
       }

       for (UserDeviceToken deviceToken : deviceTokens) {
           notificationService.sendNotification(deviceToken.getDeviceToken(), title, body);
           notificationService.saveNotification(new NotificationRequest(deviceToken.getDeviceToken(), title, body));
       }
   }
}
