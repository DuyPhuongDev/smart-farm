package hcmut.dadn.be.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pump_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PumpHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pumpId;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device; // FK đến Device

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PumpAction action;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
