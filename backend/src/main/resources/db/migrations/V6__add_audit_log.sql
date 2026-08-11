CREATE TABLE audit_logs
(
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    target_type VARCHAR(50),
    target_id   VARCHAR(50),
    detail      VARCHAR(1000),
    ip_address  VARCHAR(64),
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_username ON audit_logs (username);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);