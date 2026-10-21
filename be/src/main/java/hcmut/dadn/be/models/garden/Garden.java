package hcmut.dadn.be.models.garden;

import hcmut.dadn.be.models.BaseEntity;
import hcmut.dadn.be.models.user.User;
import hcmut.dadn.be.models.device.Device;
import hcmut.dadn.be.models.task.Task;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "gardens")
@Entity
public class Garden extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String gardenName;
    private String city;
    private String district;
    private String ward;
    private String cropName;
    private String cropStage;
    private String thumbnail;

    @Enumerated(EnumType.STRING)
    private GardenType gardenType;

    @OneToMany(mappedBy = "garden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Device> devices;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "garden", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;
}
