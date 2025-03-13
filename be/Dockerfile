# Sử dụng OpenJDK 17
FROM openjdk:17-jdk-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file JAR từ dự án vào container
COPY target/be-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 9999

# Chạy ứng dụng Spring Boot
CMD ["java", "-jar", "app.jar"]
