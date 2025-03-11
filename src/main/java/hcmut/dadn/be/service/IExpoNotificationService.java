package hcmut.dadn.be.service;

public interface IExpoNotificationService {
    void sendNotification(String expoPushToken, String title, String body);
}
