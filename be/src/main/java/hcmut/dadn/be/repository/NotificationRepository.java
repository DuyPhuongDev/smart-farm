package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
