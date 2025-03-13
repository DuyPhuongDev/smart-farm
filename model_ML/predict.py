from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()

# Load mô hình Naive Bayes
model = joblib.load("naive_bayes_pump.pkl")

# Định nghĩa request body
class SensorData(BaseModel):
    humidity: float
    temperature: float
    moisture: float

@app.post("/predict")
async def predict(data: SensorData):
    try:
        # Dự đoán
        prediction = model.predict([[data.humidity, data.temperature, data.moisture]])[0]
        pump_status = "ON" if prediction == 1 else "OFF"

        return {"pump_status": pump_status}

    except Exception as e:
        return {"error": str(e)}

# Chạy server FastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
