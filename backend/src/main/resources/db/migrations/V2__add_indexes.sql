-- Users
CREATE UNIQUE INDEX idx_users_username
    ON users (username);

-- Cameras
CREATE INDEX idx_cameras_enabled
    ON cameras (enabled);

-- Hourly stats: query by camera
CREATE INDEX idx_hourly_stats_camera_id
    ON hourly_stats (camera_id);

-- Hourly stats: query by day/time
CREATE INDEX idx_hourly_stats_recorded_at
    ON hourly_stats (recorded_at);

-- Hourly stats: common query by camera and day/time
CREATE INDEX idx_hourly_stats_camera_recorded
    ON hourly_stats (camera_id, recorded_at);

-- Hourly stats: filter partial records
CREATE INDEX idx_hourly_stats_partial
    ON hourly_stats (is_partial);
