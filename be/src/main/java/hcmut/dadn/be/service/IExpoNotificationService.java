package hcmut.dadn.be.service;

import hcmut.dadn.be.dto.NotificationRequest;
import hcmut.dadn.be.models.Notification;

public interface IExpoNotificationService {
    void sendNotification(String expoPushToken, String title, String body);
    void saveNotification(NotificationRequest request);
}
