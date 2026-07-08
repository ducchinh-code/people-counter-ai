-- Users
CREATE TABLE users
(
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER',
    enabled    BOOLEAN               DEFAULT true,
    created_at TIMESTAMP             DEFAULT NOW(),
    updated_at TIMESTAMP             DEFAULT NOW()
);

-- Cameras
CREATE TABLE cameras
(
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    source     TEXT         NOT NULL,
    region     JSONB        NOT NULL,
    tracker    VARCHAR(50)           DEFAULT 'botsort.yaml',
    enabled    BOOLEAN               DEFAULT true,
    created_at TIMESTAMP             DEFAULT NOW(),
    updated_at TIMESTAMP             DEFAULT NOW()
);

-- Hourly stats
CREATE TABLE hourly_stats
(
    id          BIGSERIAL PRIMARY KEY,
    camera_id   BIGINT      NOT NULL REFERENCES cameras (id) ON DELETE CASCADE,
    hour        VARCHAR(50) NOT NULL,
    in_count    INT         NOT NULL DEFAULT 0,
    out_count   INT         NOT NULL DEFAULT 0,
    total       INT         NOT NULL DEFAULT 0,
    is_partial  BOOLEAN              DEFAULT false,
    recorded_at TIMESTAMP            DEFAULT NOW()
);
