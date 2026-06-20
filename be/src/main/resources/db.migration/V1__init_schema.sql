
Create table roles (
                       id BIGSERIAL PRIMARY KEY,
                       role_name VARCHAR(20) not null ,
    created_at timestamptz default (NOW()),
    updated_at timestamptz default (NOW())
);

-- 1. Bảng users
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       address VARCHAR(255),
                       date_of_birth DATE,
                       email VARCHAR(100) UNIQUE, -- Thường email nên là unique
                       first_name VARCHAR(100),
                       last_name VARCHAR(100),
                       password VARCHAR(255),
                       phone_number VARCHAR(15),
                       profile_picture VARCHAR(255),
                       role_id BIGINT,
                       created_at timestamptz DEFAULT (NOW()),
                       updated_at timestamptz DEFAULT (NOW()),
    constraint fk_user_role FOREIGN KEY (role_id) references roles (id) on delete cascade
);

-- 2. Bảng user_device_token
CREATE TABLE user_device_token (
                                   id BIGSERIAL PRIMARY KEY,
                                   device_token VARCHAR(255),
                                   user_id BIGINT,
                                   created_at timestamptz DEFAULT (NOW()),
                                   updated_at timestamptz DEFAULT (NOW()),
                                   CONSTRAINT fk_user_device_token_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 3. Bảng gardens
CREATE TABLE gardens (
                         id BIGSERIAL PRIMARY KEY,
                         created_at timestamptz DEFAULT (NOW()),
                         crop_stage VARCHAR(255),
                         garden_name VARCHAR(255),
                         garden_type VARCHAR(255),
                         thumbnail VARCHAR(255),
                         updated_at timestamptz DEFAULT (NOW()),
                         user_id BIGINT,
                         crop_name VARCHAR(255),
                         city VARCHAR(255),
                         district VARCHAR(255),
                         ward VARCHAR(255),
                         CONSTRAINT fk_gardens_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. Bảng devices
CREATE TABLE devices (
                         id BIGSERIAL PRIMARY KEY,
                         device_name VARCHAR(100),
                         device_type VARCHAR(255),
                         status VARCHAR(255),
                         unit VARCHAR(255),
                         created_at timestamptz DEFAULT (NOW()),
                         updated_at timestamptz DEFAULT (NOW()),
                         garden_id BIGINT,
                         CONSTRAINT fk_devices_gardens FOREIGN KEY (garden_id) REFERENCES gardens (id) ON DELETE CASCADE
);

-- 5. Bảng sensor_data (với TimescaleDB)
CREATE TABLE sensor_metrics_30s (
                                    time        timestamptz NOT NULL,   -- window_start
                                    device_id  BIGINT NOT NULL,
                                    sensor_type      VARCHAR(50) NOT NULL,
                                    avg_value  DOUBLE PRECISION,
                                    min_value  DOUBLE PRECISION,
                                    max_value  DOUBLE PRECISION,
                                    count      INTEGER
);

SELECT create_hypertable(
               'sensor_metrics_30s',
               'time',
               chunk_time_interval => INTERVAL '1 day'
       );

CREATE INDEX idx_metrics_device_time
    ON sensor_metrics_30s (device_id, time DESC);

-- 7. Bảng tasks
CREATE TABLE tasks (
                       id BIGSERIAL PRIMARY KEY,
                       description VARCHAR(255),
                       due_date DATE,
                       status VARCHAR(255),
                       type VARCHAR(255),
                       user_id BIGINT,
                       garden_id BIGINT,
                       CONSTRAINT fk_tasks_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                       CONSTRAINT fk_tasks_gardens FOREIGN KEY (garden_id) REFERENCES gardens (id) ON DELETE CASCADE
);

-- 8. Bảng notifications
CREATE TABLE notifications (
                               id BIGSERIAL PRIMARY KEY,
                               message TEXT,
                               sent_at timestamptz DEFAULT (NOW()),
                               title TEXT,
                               user_id BIGINT,
                               CONSTRAINT fk_notifications_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);