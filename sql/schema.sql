-- ============================================================
-- Controlled Substances Register
-- Procedure: INV-CONT-001
-- Retention: 7 years minimum (PPB requirement)
-- ============================================================

CREATE TABLE controlled_substances_register (
  id                       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transaction_date         DATETIME      NOT NULL,
  transaction_type         ENUM(
                             'RECEIVED',
                             'DISPENSED',
                             'RETURNED',
                             'DESTROYED',
                             'COUNT_ADJUSTMENT'
                           )             NOT NULL,
  drug_id                  INT           NOT NULL,
  batch_number             VARCHAR(50)   NOT NULL,
  quantity                 DECIMAL(10,3) NOT NULL,
  unit                     VARCHAR(20)   NOT NULL,
  patient_name             VARCHAR(255),
  patient_id_number        VARCHAR(50),
  prescriber_name          VARCHAR(255),
  prescriber_license       VARCHAR(50),
  dispensing_pharmacist    VARCHAR(255)  NOT NULL,
  witnessing_pharmacist    VARCHAR(255)  NOT NULL,
  opening_balance          DECIMAL(10,3),
  closing_balance          DECIMAL(10,3),
  reason_for_transaction   TEXT,
  ppb_report_generated     BOOLEAN       DEFAULT FALSE,
  created_at               TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_drug_id        (drug_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_batch_number   (batch_number),
  INDEX idx_ppb_report     (ppb_report_generated)
);

-- ============================================================
-- Audit Log Table
-- Section 9: Compliance & Audit Preparation
-- Retention: 5 years minimum (immutable, cryptographically signed)
-- ============================================================

CREATE TABLE audit_log (
  log_id              BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id             INT          NOT NULL,
  action_type         VARCHAR(50),
  table_name          VARCHAR(50),
  record_id           VARCHAR(100),
  old_value           JSON,
  new_value           JSON,
  ip_address          VARCHAR(45),
  device_id           VARCHAR(100),
  timestamp           DATETIME(3),
  reason              TEXT,
  supervisor_approval VARCHAR(50),

  INDEX idx_user_id   (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_table     (table_name)
);
