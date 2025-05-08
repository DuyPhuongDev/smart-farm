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
import hcmut.dadn.be.service.IExpoNotificationService;
import hcmut.dadn.be.util.DeviceCache;
import hcmut.dadn.be.util.SensorDataBatchSaver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

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
   private final AtomicBoolean reconnecting = new AtomicBoolean(false);

   @Value("${AIO_USERNAME}")
   private String username;

   @EventListener(ContextRefreshedEvent.class)
    public void subscribe() throws Exception {
        configureAndConnect();
    }

    private void configureAndConnect() throws Exception {
        // Thiết lập các tùy chọn kết nối với keep-alive ngắn hơn
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(30);
        options.setKeepAliveInterval(60); // 60 giây cho keep-alive

        // Kết nối với các tùy chọn đã cấu hình
        if (!mqttClient.isConnected()) {
            mqttClient.connect(options);
        }
        
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
       log.error("❌ Mất kết nối MQTT: {}", cause.getMessage());
       attemptReconnect();
   }
   
   private void attemptReconnect() {
       // Đảm bảo chỉ một luồng đang cố gắng kết nối lại
       if (reconnecting.compareAndSet(false, true)) {
           try {
               log.info("🔄 Đang thử kết nối lại MQTT...");
               // Cố gắng kết nối lại tối đa 5 lần
               int attempts = 0;
               while (!mqttClient.isConnected() && attempts < 5) {
                   try {
                       attempts++;
                       Thread.sleep(5000);  // Đợi 5 giây rồi thử kết nối lại
                       configureAndConnect();
                       log.info("🔄 Đã kết nối lại MQTT thành công sau {} lần thử!", attempts);
                       break;
                   } catch (Exception e) {
                       log.error("⚠️ Lần thử kết nối lại thứ {}: {}", attempts, e.getMessage());
                   }
               }
           } catch (Exception e) {
               log.error("⚠️ Lỗi trong quá trình kết nối lại: {}", e.getMessage());
           } finally {
               reconnecting.set(false);
           }
       }
   }

   // Kiểm tra kết nối định kỳ (1 phút một lần) và kết nối lại nếu cần
   @Scheduled(fixedRate = 60000)
   public void checkConnection() {
       if (!mqttClient.isConnected() && !reconnecting.get()) {
           log.warn("⚠️ Phát hiện mất kết nối trong quá trình kiểm tra định kỳ");
           attemptReconnect();
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
