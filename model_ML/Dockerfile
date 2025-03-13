# Sử dụng Python 3.9
FROM python:3.9

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép file vào container
COPY predict.py .
COPY naive_bayes_pump.pkl .

# Cài đặt thư viện Python (FastAPI + Uvicorn)
RUN pip install --no-cache-dir fastapi uvicorn joblib scikit-learn numpy pandas
EXPOSE 8000
# Chạy FastAPI server
CMD ["uvicorn", "predict:app", "--host", "0.0.0.0", "--port", "8000"]
