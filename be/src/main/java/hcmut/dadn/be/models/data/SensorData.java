package hcmut.dadn.be.models.data;

import hcmut.dadn.be.models.device.Device;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    private Float value;

    @Enumerated(EnumType.STRING)
    private SensorAlert sensorAlert;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime recordAt;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;
}