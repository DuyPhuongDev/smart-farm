package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    @Query("SELECT d.feed FROM Device d")
    List<String> findAllFeeds();

    Device findByFeed(String feedName);
}
