#!/bin/bash

# Chuyển tới folder be
cd be || { echo "Thư mục be không tồn tại."; exit 1; }
echo "Running Maven build..."
./mvnw clean package

if [ $? -ne 0 ]; then
    echo "Lỗi khi build Maven. Kiểm tra lại cấu hình Maven hoặc mã nguồn."
    exit 1
fi

echo "Build Maven xong, bắt đầu build lại Docker..."

# Quay lại thư mục trước
cd ..

echo "Building Docker images..."
docker-compose -f docker-compose.yml build

if [ $? -ne 0 ]; then
    echo "Lỗi khi build Docker Compose."
    exit 1
fi

echo "Xóa các Docker images cũ..."
docker image prune -f

echo "Running Docker containers..."
docker-compose -f docker-compose.yml up -d

if [ $? -ne 0 ]; then
    echo "Lỗi khi khởi động Docker Compose."
    exit 1
fi

# Delay 3 giây trước khi thông báo thành công
sleep 3

echo "Deploy thành công!"

exit 0
