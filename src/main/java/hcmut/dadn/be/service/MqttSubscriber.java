package hcmut.dadn.be.service;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class MqttSubscriber implements MqttCallback {

    private final MqttClient mqttClient;

    @Value("${HUMIDITY_FEED}")
    private String humidityTopic;

    @Value("${PUMP_FEED}")
    private String pumpTopic;

    public MqttSubscriber(MqttClient mqttClient) {
        this.mqttClient = mqttClient;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void subscribe() throws Exception {
        mqttClient.setCallback(this);
        mqttClient.subscribe(humidityTopic);  // Đăng ký nhận dữ liệu từ cảm biến độ ẩm
        mqttClient.subscribe(pumpTopic);      // Đăng ký nhận trạng thái máy bơm

        System.out.println("✅ Subscribed to topics:");
        System.out.println("📌 Humidity: " + humidityTopic);
        System.out.println("📌 Pump: " + pumpTopic);
    }

    @Override
    public void connectionLost(Throwable cause) {
        System.err.println("❌ Mất kết nối MQTT: " + cause.getMessage());
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload());
        System.out.println("📩 Nhận dữ liệu từ " + topic + ": " + payload);

        // Xử lý dữ liệu nhận được (lưu vào DB, gửi WebSocket, điều khiển bơm, ...)
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Không cần xử lý vì chỉ subscribe
    }
}
