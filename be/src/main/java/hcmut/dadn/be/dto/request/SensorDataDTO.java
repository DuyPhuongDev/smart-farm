package hcmut.dadn.be.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SensorDataDTO {
    Float humidity;
    Float temperature;
    Float moisture;

    // Kiểm tra nếu đã nhận đủ dữ liệu để dự đoán
    public boolean isReadyForPrediction() {
        return temperature != null && moisture != null && humidity != null;
    }

    // Xóa dữ liệu sau khi đã xử lý (nếu cần reset)
    public void clearData() {
        this.temperature = null;
        this.moisture = null;
        this.humidity = null;
    }
}
