package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.PumpHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PumpHistoryRepository extends JpaRepository<PumpHistory, Long> {
    List<PumpHistory> findByDevice_DeviceId(Long deviceId);
}
