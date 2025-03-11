package hcmut.dadn.be.dto;

import lombok.Data;

@Data
public class NotificationRequest {
    private String deviceToken;
    private String title;
    private String body;
}