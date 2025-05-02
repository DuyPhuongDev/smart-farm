package hcmut.dadn.be.dto.request;

import lombok.Data;

@Data
public class DeviceTokenDTO {
    private Long userId;
    private String deviceToken;
}
