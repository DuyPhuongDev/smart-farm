package hcmut.dadn.be.response;

import hcmut.dadn.be.models.Device;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class DeviceResponse {
    private Long deviceId;
    private String deviceName;
    private String feed;
    private String location;
    private Long userId;
    private String userName;

    public static DeviceResponse fromDevice(Device device) {
        return DeviceResponse.builder()
                .deviceId(device.getDeviceId())
                .deviceName(device.getDeviceName())
                .feed(device.getFeed())
                .location(device.getLocation())
                .userId(device.getUser().getId())
                .userName(device.getUser().getFullName())
                .build();
    }
}
