CREATE TABLE IF NOT EXISTS users
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    username            VARCHAR(50) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    role                VARCHAR(20) NOT NULL, -- ADMIN, MANAGER, DISPATCHER, TECHNICIAN, CUSTOMER
    enabled             BOOLEAN DEFAULT TRUE,
    created_by          VARCHAR(100) NOT NULL,
    created_date        DATETIME(6) NOT NULL,
    last_modified_by    VARCHAR(100),
    last_modified_date  DATETIME(6),
    version             INT DEFAULT 0
);

CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_email ON users(email);