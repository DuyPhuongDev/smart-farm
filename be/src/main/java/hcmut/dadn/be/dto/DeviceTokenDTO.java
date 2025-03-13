package hcmut.dadn.be.dto;

import lombok.Data;

@Data
public class DeviceTokenDTO {
    private Long userId;
    private String deviceToken;
}
