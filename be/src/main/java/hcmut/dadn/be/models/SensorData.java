package hcmut.dadn.be.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor



public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dataId;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device; // FK đến Device

    private Float temperature;

    private Float soilMoisture;

    private Float humidity;

    private Float lux;

    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();
}