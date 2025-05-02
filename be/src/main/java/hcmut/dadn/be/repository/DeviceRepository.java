package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.device.Device;
import hcmut.dadn.be.models.device.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findAllByDeviceTypeAndGardenId(DeviceType deviceType, Long gardenId);

    List<Device> findAllByDeviceTypeNot(DeviceType deviceType);
}
