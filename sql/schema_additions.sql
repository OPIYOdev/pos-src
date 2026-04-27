-- ============================================================
-- Core POS Tables (Full Definitions from PHARMACYPOSSYSTEM.docx)
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  drug_category VARCHAR(100),
  unit_of_measure VARCHAR(50),
  is_controlled BOOLEAN DEFAULT FALSE,
  requires_cold_chain BOOLEAN DEFAULT FALSE,
  stock_quantity DECIMAL(10,3) DEFAULT 0,
  reorder_level DECIMAL(10,3) DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(50) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  residential_area VARCHAR(100),
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  registered_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  chronic_disease_tag BOOLEAN DEFAULT FALSE,
  tin VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_account (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  `limit` DECIMAL(15,2) DEFAULT 50000,
  balance DECIMAL(15,2) DEFAULT 0,
  last_payment_date DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS credit_transaction (
  id INT PRIMARY KEY AUTO_INCREMENT,
  credit_account_id INT NOT NULL,
  sale_id INT,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type ENUM('DEBIT', 'CREDIT', 'LATE_FEE') NOT NULL,
  description TEXT,
  due_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_account_id) REFERENCES credit_account(id)
);

CREATE TABLE IF NOT EXISTS insurance_schemes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scheme_name VARCHAR(255) NOT NULL,
  pre_auth_threshold DECIMAL(15,2) DEFAULT 50000,
  co_payment_type ENUM('PERCENTAGE', 'FIXED') DEFAULT 'FIXED',
  co_payment_value DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS insurance_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  scheme_id INT NOT NULL,
  membership_number VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (scheme_id) REFERENCES insurance_schemes(id)
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  sale_id INT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  insurance_amount DECIMAL(15,2) NOT NULL,
  patient_co_payment DECIMAL(15,2) NOT NULL,
  status ENUM('SUBMITTED', 'PENDING', 'PAID', 'REJECTED') DEFAULT 'SUBMITTED',
  claim_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_date DATETIME,
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  claim_reference VARCHAR(100) UNIQUE,
  FOREIGN KEY (member_id) REFERENCES insurance_members(id)
);

CREATE TABLE IF NOT EXISTS sale (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT,
  total_amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  payment_status ENUM('PAID', 'PARTIAL', 'UNPAID') DEFAULT 'UNPAID',
  kra_invoice_number VARCHAR(100),
  is_tax_compliant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS sale_item (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sale(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('CASH', 'MPESA', 'CARD', 'INSURANCE', 'CREDIT') NOT NULL,
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sale(id)
);

CREATE TABLE IF NOT EXISTS backorder (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  drug_id INT NOT NULL,
  balance_quantity DECIMAL(10,3) NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  FOREIGN KEY (patient_id) REFERENCES customers(id),
  FOREIGN KEY (drug_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sms_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS variance_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cashier_id INT NOT NULL,
  expected_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) NOT NULL,
  variance DECIMAL(15,2) NOT NULL,
  severity ENUM('MINOR', 'MODERATE', 'CRITICAL') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stored Procedures
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS RegisterNewPatient(
  IN p_full_name VARCHAR(255),
  IN p_id_number VARCHAR(50),
  IN p_dob DATE,
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(255),
  IN p_residential_area VARCHAR(100),
  IN p_registered_by INT
)
BEGIN
  DECLARE v_patient_id VARCHAR(50);
  DECLARE v_duplicate_count INT;
  SELECT COUNT(*) INTO v_duplicate_count FROM customers WHERE id_number = p_id_number;
  IF v_duplicate_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Patient with this ID already exists';
  END IF;
  SET v_patient_id = CONCAT('PAT-', YEAR(CURDATE()), '-', LPAD((SELECT COUNT(*) + 1 FROM customers), 6, '0'));
  INSERT INTO customers (patient_id, full_name, id_number, date_of_birth, phone, email, residential_area, registration_date, registered_by)
  VALUES (v_patient_id, p_full_name, p_id_number, p_dob, p_phone, p_email, p_residential_area, NOW(), p_registered_by);
  INSERT INTO sms_queue (recipient, message) VALUES (p_phone, CONCAT('Welcome! Your patient ID is ', v_patient_id));
  SELECT v_patient_id AS patient_id;
END //
DELIMITER ;
