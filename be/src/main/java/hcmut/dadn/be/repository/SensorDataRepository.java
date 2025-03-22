package hcmut.dadn.be.repository;

import hcmut.dadn.be.models.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    // 1️⃣ Lấy độ ẩm trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.soilMoisture IS NOT NULL ORDER BY s.recordedAt DESC")
    List<SensorData> findMoistureLast24Hours(LocalDateTime fromTime);

    // 2️⃣ Lấy ánh sáng trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.lux IS NOT NULL ORDER BY s.recordedAt DESC")
    List<SensorData> findLuxLast24Hours(LocalDateTime fromTime);

    // 3️⃣ Lấy nhiệt độ trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.temperature IS NOT NULL ORDER BY s.recordedAt DESC")
    List<SensorData> findTemperatureLast24Hours(LocalDateTime fromTime);

    // 4️⃣ Lấy độ ẩm theo giờ trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.soilMoisture IS NOT NULL ORDER BY s.recordedAt")
    List<SensorData> findMoistureDataForHourlyAverage(LocalDateTime fromTime);
    
    // 5️⃣ Lấy ánh sáng theo giờ trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.lux IS NOT NULL ORDER BY s.recordedAt")
    List<SensorData> findLuxDataForHourlyAverage(LocalDateTime fromTime);
    
    // 6️⃣ Lấy nhiệt độ theo giờ trong 24 giờ gần nhất
    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.temperature IS NOT NULL ORDER BY s.recordedAt")
    List<SensorData> findTemperatureDataForHourlyAverage(LocalDateTime fromTime);

    @Query("SELECT s FROM SensorData s WHERE s.recordedAt >= :fromTime AND s.humidity IS NOT NULL ORDER BY s.recordedAt")
    List<SensorData> findHumidityDataForHourlyAverage(LocalDateTime fromTime);
}
