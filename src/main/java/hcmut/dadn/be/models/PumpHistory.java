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

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true)
    private User user; // FK đến User (nullable, vì có thể là tự động)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PumpAction action;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
}
