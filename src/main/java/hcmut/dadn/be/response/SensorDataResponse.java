package hcmut.dadn.be.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import hcmut.dadn.be.models.SensorData;
import lombok.*;

import java.time.LocalDateTime;


@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public class SensorDataResponse {
    private Long dataId;
    private Float temperature;
    private Float soilMoisture;
    private Float lux;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime recordedAt;
    public static SensorDataResponse fromSensorData(SensorData sensorData) {
        return SensorDataResponse.builder()
                .dataId(sensorData.getDataId())
                .temperature(sensorData.getTemperature())
                .soilMoisture(sensorData.getSoilMoisture())
                .lux(sensorData.getLux())
                .recordedAt(sensorData.getRecordedAt())
                .build();
    }
}



