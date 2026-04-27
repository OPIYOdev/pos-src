-- Missing tables from GAPs.txt
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  stock_quantity DECIMAL(10,3) DEFAULT 0
);

CREATE TABLE inventory_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_number VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  drug_id INT,
  quantity_available DECIMAL(10,3) DEFAULT 0,
  quantity_reserved DECIMAL(10,3) DEFAULT 0,
  expiry_date DATE,
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  is_quarantined BOOLEAN DEFAULT FALSE,
  branch_id INT
);

CREATE TABLE branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  manager_id INT
);

CREATE TABLE transfer_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  source_branch_id INT NOT NULL,
  destination_branch_id INT NOT NULL,
  requested_by INT,
  priority VARCHAR(20),
  status VARCHAR(50),
  total_items INT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfer_request_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_request_id INT NOT NULL,
  drug_id INT NOT NULL,
  quantity_requested DECIMAL(10,2),
  quantity_approved DECIMAL(10,2),
  status VARCHAR(50)
);

CREATE TABLE transfer_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_request_id INT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  source_branch_id INT NOT NULL,
  destination_branch_id INT NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

CREATE TABLE transfer_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id INT NOT NULL,
  drug_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  status VARCHAR(50)
);

CREATE TABLE transfer_reconciliation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transfer_order_id INT NOT NULL,
  verification_status VARCHAR(50),
  discrepancy_details JSON,
  resolution_status VARCHAR(50)
);

-- Other missing tables
CREATE TABLE sale (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE sale_item (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE payment (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE purchase_order (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE grn (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE grn_item (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE suppliers (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE prescription (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE prescription_item (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE dispensing_record (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE prescribers (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE customers (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE backorder (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE credit_account (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE credit_transaction (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE insurance_scheme (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE insurance_member (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE insurance_claim (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE claim_item (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE sms_queue (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE loyalty_points (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE allergy_record (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE chronic_condition (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE visit_history (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE roles (id INT PRIMARY KEY AUTO_INCREMENT);
CREATE TABLE variance_log (id INT PRIMARY KEY AUTO_INCREMENT);
