CREATE TABLE IF NOT EXISTS customers
(
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(50),
    address_line        VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    postal_code         VARCHAR(20),
    country             VARCHAR(100),
    created_by          VARCHAR(100) NOT NULL,
    created_date        DATETIME(6) NOT NULL,
    last_modified_by    VARCHAR(100),
    last_modified_date  DATETIME(6),
    version             INT DEFAULT 0
);

CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_customer_name ON customers(name);