package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.User;
import hcmut.dadn.be.models.UserDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceToken, Long> {
    List<UserDeviceToken> findAllByUser(User user);

    boolean existsByUser(User user);

    UserDeviceToken findByDeviceToken(String token);
}
