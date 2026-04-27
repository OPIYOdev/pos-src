-- ============================================================
-- Multi-Branch Product Reallocation Module — Database Schema
-- Module: MB-TRANS / MB-AUTO / MB-COST / MB-BILL / MB-DISP
-- Version: 1.0
-- ============================================================

-- -------------------------------------------------------
-- 1. BRANCHES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
  id                   INT           PRIMARY KEY AUTO_INCREMENT,
  branch_name          VARCHAR(255)  NOT NULL,
  branch_code          VARCHAR(20)   UNIQUE,
  region               VARCHAR(100),
  address              TEXT,
  phone                VARCHAR(30),
  email                VARCHAR(255),
  manager_id           INT,
  regional_manager_id  INT,
  pharmacy_lead_id     INT,
  is_active            BOOLEAN       DEFAULT TRUE,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_region      (region),
  INDEX idx_manager     (manager_id),
  INDEX idx_active      (is_active)
);

-- -------------------------------------------------------
-- 2. DRUGS (unified with products)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS drugs (
  id                   INT           PRIMARY KEY AUTO_INCREMENT,
  generic_name         VARCHAR(255)  NOT NULL,
  brand_name           VARCHAR(255),
  drug_category        VARCHAR(100),
  unit_of_measure      VARCHAR(50),
  is_controlled        BOOLEAN       DEFAULT FALSE,
  requires_cold_chain  BOOLEAN       DEFAULT FALSE,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_generic    (generic_name),
  INDEX idx_category   (drug_category)
);

-- -------------------------------------------------------
-- 3. INVENTORY BATCHES (branch-level)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_batches (
  id                   INT           PRIMARY KEY AUTO_INCREMENT,
  batch_number         VARCHAR(50)   NOT NULL,
  drug_id              INT           NOT NULL,
  branch_id            INT           NOT NULL,
  quantity_available   DECIMAL(10,3) DEFAULT 0,
  quantity_reserved    DECIMAL(10,3) DEFAULT 0,
  expiry_date          DATE          NOT NULL,
  cost_price           DECIMAL(12,2),
  selling_price        DECIMAL(12,2),
  is_quarantined       BOOLEAN       DEFAULT FALSE,
  is_reserved          BOOLEAN       DEFAULT FALSE,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  UNIQUE  KEY uq_batch_branch   (batch_number, branch_id),
  INDEX       idx_drug_branch   (drug_id, branch_id),
  INDEX       idx_expiry        (expiry_date),
  INDEX       idx_quarantined   (is_quarantined),
  FOREIGN KEY (drug_id)   REFERENCES drugs(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 4. DRUG SALES STATS (for auto-reallocation calculations)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_sales_stats (
  id                   INT           PRIMARY KEY AUTO_INCREMENT,
  drug_id              INT           NOT NULL,
  branch_id            INT           NOT NULL,
  daily_sales_30d      DECIMAL(10,3) DEFAULT 0,
  daily_sales_90d      DECIMAL(10,3) DEFAULT 0,
  last_updated         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_drug_branch (drug_id, branch_id),
  FOREIGN KEY (drug_id)   REFERENCES drugs(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 5. TRANSFER LIMITS BY DRUG CATEGORY
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_limits (
  id                           INT           PRIMARY KEY AUTO_INCREMENT,
  drug_category                VARCHAR(100),
  max_quantity_per_transfer    INT,
  max_value_per_transfer       DECIMAL(15,2),
  requires_pharmacist_approval BOOLEAN       DEFAULT TRUE,
  cold_chain_required          BOOLEAN       DEFAULT FALSE,
  controlled_substance_rules   JSON,
  created_at                   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO transfer_limits
  (drug_category, max_quantity_per_transfer, max_value_per_transfer)
VALUES
  ('Standard OTC',          1000, 500000),
  ('Prescription Only',      500, 750000),
  ('Controlled Substances',  100, 250000),
  ('Cold Chain',             200, 500000),
  ('High Value (>10k/unit)',  50, 500000);

-- -------------------------------------------------------
-- 6. TRANSFER REQUESTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_requests (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  request_id              VARCHAR(50)   UNIQUE NOT NULL,
  source_branch_id        INT           NOT NULL,
  destination_branch_id   INT           NOT NULL,
  requested_by            INT,
  approved_by             INT,
  approved_at             TIMESTAMP     NULL,
  priority                ENUM('URGENT','NORMAL','LOW') DEFAULT 'NORMAL',
  status                  ENUM(
                            'DRAFT','PENDING_APPROVAL','AUTO_GENERATED',
                            'APPROVED','PROCESSING','IN_TRANSIT',
                            'RECEIVED','COMPLETED','REJECTED',
                            'CANCELLED','EXPIRED'
                          )             DEFAULT 'PENDING_APPROVAL',
  total_items             INT           DEFAULT 0,
  total_estimated_value   DECIMAL(15,2) DEFAULT 0,
  reason                  TEXT,
  rejection_reason        TEXT,
  allow_partial           BOOLEAN       DEFAULT FALSE,
  auto_generated          BOOLEAN       DEFAULT FALSE,
  required_by_date        DATE,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status         (status),
  INDEX idx_source         (source_branch_id),
  INDEX idx_destination    (destination_branch_id),
  INDEX idx_created        (created_at),
  FOREIGN KEY (source_branch_id)      REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 7. TRANSFER REQUEST ITEMS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_request_items (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_request_id     BIGINT        NOT NULL,
  drug_id                 INT           NOT NULL,
  quantity_requested      DECIMAL(10,2) NOT NULL,
  quantity_approved       DECIMAL(10,2) DEFAULT 0,
  batch_preference        ENUM('FEFO','SPECIFIC') DEFAULT 'FEFO',
  status                  ENUM('PENDING','APPROVED','PARTIALLY_APPROVED','REJECTED') DEFAULT 'PENDING',
  notes                   TEXT,

  INDEX idx_request        (transfer_request_id),
  FOREIGN KEY (transfer_request_id) REFERENCES transfer_requests(id),
  FOREIGN KEY (drug_id)             REFERENCES drugs(id)
);

-- -------------------------------------------------------
-- 8. TRANSFER ORDERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_orders (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_request_id     BIGINT,
  order_number            VARCHAR(50)   UNIQUE NOT NULL,
  source_branch_id        INT           NOT NULL,
  destination_branch_id   INT           NOT NULL,
  status                  ENUM(
                            'CREATED','PICKING','PICKED','DISPATCHED',
                            'IN_TRANSIT','RECEIVED','VERIFYING',
                            'COMPLETED','CANCELLED','DISPUTED'
                          )             DEFAULT 'CREATED',
  priority                ENUM('URGENT','NORMAL','LOW') DEFAULT 'NORMAL',
  created_by              INT,
  received_by             INT,
  waybill_id              BIGINT,
  transporter_details     JSON,
  expected_delivery_date  DATE,
  dispatched_at           TIMESTAMP     NULL,
  received_at             TIMESTAMP     NULL,
  completed_at            TIMESTAMP     NULL,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_status         (status),
  INDEX idx_source         (source_branch_id),
  INDEX idx_destination    (destination_branch_id),
  FOREIGN KEY (transfer_request_id)   REFERENCES transfer_requests(id),
  FOREIGN KEY (source_branch_id)      REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 9. TRANSFER ORDER ITEMS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_order_items (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT        NOT NULL,
  drug_id                 INT           NOT NULL,
  batch_id                INT           NOT NULL,
  quantity                DECIMAL(10,2) NOT NULL,
  unit_cost               DECIMAL(12,2),
  total_cost              DECIMAL(15,2),
  status                  ENUM('PENDING','PICKED','DISPATCHED','RECEIVED','VERIFIED') DEFAULT 'PENDING',

  INDEX idx_order          (transfer_order_id),
  FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id),
  FOREIGN KEY (drug_id)           REFERENCES drugs(id),
  FOREIGN KEY (batch_id)          REFERENCES inventory_batches(id)
);

-- -------------------------------------------------------
-- 10. WAYBILLS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS waybills (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT        NOT NULL,
  waybill_number          VARCHAR(100)  UNIQUE NOT NULL,
  transporter_name        VARCHAR(255),
  transporter_contact     VARCHAR(50),
  vehicle_number          VARCHAR(50),
  driver_name             VARCHAR(255),
  estimated_arrival       DATETIME,
  actual_arrival          DATETIME,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id)
);

-- -------------------------------------------------------
-- 11. TRANSFER RECEIVING
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_receiving (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT        NOT NULL,
  received_by             INT,
  received_at             TIMESTAMP     NULL,
  verification_status     ENUM('PENDING','VERIFIED','DISCREPANCY_FOUND') DEFAULT 'PENDING',
  discrepancy_details     JSON,
  completed_at            TIMESTAMP     NULL,

  INDEX idx_order          (transfer_order_id),
  FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id)
);

-- -------------------------------------------------------
-- 12. TRANSFER RECONCILIATION
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_reconciliation (
  id                           BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id            BIGINT        NOT NULL,
  reconciliation_date          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  source_branch_confirmed      BOOLEAN       DEFAULT FALSE,
  destination_branch_confirmed BOOLEAN       DEFAULT FALSE,
  verification_status          ENUM('PENDING','VERIFIED','DISCREPANCY_FOUND') DEFAULT 'PENDING',
  discrepancy_details          JSON,
  resolution_status            ENUM('OPEN','IN_REVIEW','RESOLVED','ESCALATED','CLOSED') DEFAULT 'OPEN',
  status                       VARCHAR(50)   DEFAULT 'PENDING',

  FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id)
);

-- -------------------------------------------------------
-- 13. TRANSFER DISPUTES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_disputes (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT        NOT NULL,
  transfer_item_id        BIGINT,
  dispute_type            ENUM(
                            'QUANTITY_SHORT','QUANTITY_EXCESS',
                            'DAMAGED','EXPIRED','WRONG_PRODUCT'
                          )             NOT NULL,
  description             TEXT,
  expected_quantity       DECIMAL(10,2),
  received_quantity       DECIMAL(10,2),
  damaged_quantity        DECIMAL(10,2),
  evidence_photos         JSON,
  resolution_status       ENUM('OPEN','IN_REVIEW','RESOLVED','ESCALATED','CLOSED') DEFAULT 'OPEN',
  resolution_action       TEXT,
  credit_note_issued      BOOLEAN       DEFAULT FALSE,
  credit_note_number      VARCHAR(100),
  resolved_by             INT,
  resolved_at             TIMESTAMP     NULL,
  escalated_to            INT,
  escalated_at            TIMESTAMP     NULL,
  created_by              INT,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order          (transfer_order_id),
  INDEX idx_status         (resolution_status),
  FOREIGN KEY (transfer_order_id) REFERENCES transfer_orders(id)
);

-- -------------------------------------------------------
-- 14. TRANSFER COSTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_costs (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT        NOT NULL,
  cost_type               ENUM('TRANSPORT','HANDLING','INSURANCE','STORAGE','OTHER') NOT NULL,
  amount                  DECIMAL(15,2) NOT NULL,
  currency                VARCHAR(3)    DEFAULT 'KES',
  paid_by_branch_id       INT,
  allocated_to_branch_id  INT,
  invoice_number          VARCHAR(100),
  description             TEXT,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order          (transfer_order_id),
  FOREIGN KEY (transfer_order_id)       REFERENCES transfer_orders(id),
  FOREIGN KEY (paid_by_branch_id)       REFERENCES branches(id),
  FOREIGN KEY (allocated_to_branch_id)  REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 15. INTER-BRANCH SETTLEMENTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS inter_branch_settlements (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  branch_id               INT           NOT NULL,
  settlement_month        DATE          NOT NULL,
  value_sent              DECIMAL(15,2) DEFAULT 0,
  value_received          DECIMAL(15,2) DEFAULT 0,
  net_settlement          DECIMAL(15,2) DEFAULT 0,
  status                  ENUM('OWED_TO_CORPORATE','OWED_FROM_CORPORATE','BALANCED') DEFAULT 'BALANCED',
  generated_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_branch_month (branch_id, settlement_month),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- -------------------------------------------------------
-- 16. TRANSFER ALERT LOG
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_alert_log (
  id                      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id       BIGINT,
  event_type              VARCHAR(50),
  recipients              JSON,
  message                 JSON,
  sent_at                 TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order          (transfer_order_id),
  INDEX idx_event          (event_type)
);

-- -------------------------------------------------------
-- 17. CROSS-BRANCH STOCK VIEW
-- -------------------------------------------------------
CREATE OR REPLACE VIEW v_cross_branch_stock AS
SELECT
  d.id              AS drug_id,
  d.generic_name,
  d.brand_name,
  b.id              AS branch_id,
  b.branch_name,
  SUM(ib.quantity_available) AS total_available,
  SUM(ib.quantity_reserved)  AS total_reserved,
  MIN(ib.expiry_date)        AS earliest_expiry,
  COUNT(DISTINCT ib.batch_number) AS batch_count
FROM drugs d
JOIN inventory_batches ib ON d.id = ib.drug_id
JOIN branches b           ON ib.branch_id = b.id
WHERE ib.expiry_date    > CURDATE()
  AND ib.is_quarantined = FALSE
GROUP BY d.id, b.id, b.branch_name;

-- -------------------------------------------------------
-- 18. RECONCILIATION STORED PROCEDURE
-- -------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS ReconcileTransferStock(
  IN p_transfer_order_id INT,
  IN p_verification_data JSON
)
BEGIN
  DECLARE v_discrepancy_count   INT DEFAULT 0;
  DECLARE v_source_branch_id    INT;
  DECLARE v_destination_branch_id INT;

  SELECT source_branch_id, destination_branch_id
    INTO v_source_branch_id, v_destination_branch_id
    FROM transfer_orders
   WHERE id = p_transfer_order_id;

  INSERT INTO transfer_reconciliation (
    transfer_order_id,
    reconciliation_date,
    source_branch_confirmed,
    destination_branch_confirmed,
    status
  ) VALUES (
    p_transfer_order_id,
    NOW(),
    FALSE,
    FALSE,
    'PENDING'
  );

  -- Discrepancy processing and stock update logic
  -- is handled by the application layer (verifyAndCompleteTransfer).
END$$

DELIMITER ;

-- -------------------------------------------------------
-- 19. TRANSFER VELOCITY REPORT VIEW
-- -------------------------------------------------------
CREATE OR REPLACE VIEW v_transfer_velocity AS
SELECT
  t.source_branch_id,
  b1.branch_name                                                    AS source_branch,
  t.destination_branch_id,
  b2.branch_name                                                    AS destination_branch,
  COUNT(*)                                                          AS transfer_count,
  AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.completed_at))           AS avg_completion_hours,
  SUM(ti.quantity)                                                  AS total_units_transferred,
  SUM(ti.quantity * ti.unit_cost)                                   AS total_value
FROM transfer_orders t
JOIN transfer_order_items ti ON t.id = ti.transfer_order_id
JOIN branches b1              ON t.source_branch_id = b1.id
JOIN branches b2              ON t.destination_branch_id = b2.id
WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND t.status = 'COMPLETED'
GROUP BY t.source_branch_id, t.destination_branch_id, b1.branch_name, b2.branch_name
ORDER BY transfer_count DESC;
