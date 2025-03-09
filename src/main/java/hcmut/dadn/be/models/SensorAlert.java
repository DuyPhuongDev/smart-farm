package hcmut.dadn.be.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SensorAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long alertId;

    @ManyToOne
    @JoinColumn(name = "sensor_id", nullable = false)
    private Device sensor; // FK đến Device (chỉ áp dụng cho cảm biến)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType alertType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime triggeredAt = LocalDateTime.now();
}