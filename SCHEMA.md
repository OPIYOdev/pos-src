# Pharmacy POS System - Database Schema Documentation

## Overview

The Pharmacy POS System uses MySQL 8.0 with 66 tables organized into three main categories:

1. **Core Tables (37)** - Base business entities
2. **Transfer Tables (16)** - Multi-branch reallocation
3. **Additional Tables (13)** - Extended functionality

---

## Core Tables

### Users Table

Stores user accounts and authentication data.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role ENUM('admin', 'manager', 'pharmacist', 'cashier', 'dispenser', 'accountant', 'claims_officer', 'auditor') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `email`

---

### Branches Table

Stores pharmacy branch information.

```sql
CREATE TABLE branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  manager_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `manager_id`

---

### Products Table

Stores drug/product information.

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  generic_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  category VARCHAR(100),
  unit_of_measure VARCHAR(50),
  is_controlled BOOLEAN DEFAULT FALSE,
  requires_cold_chain BOOLEAN DEFAULT FALSE,
  reorder_level INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `category`

---

### Inventory Table

Stores inventory batches with FEFO tracking.

```sql
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  product_id INT NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  quantity_available DECIMAL(10,3) DEFAULT 0,
  quantity_reserved DECIMAL(10,3) DEFAULT 0,
  expiry_date DATE NOT NULL,
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  is_quarantined BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY (branch_id, batch_number)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `branch_id`, `product_id`
- UNIQUE: `branch_id`, `batch_number`
- INDEX: `expiry_date`

---

### Sales Table

Stores POS transactions.

```sql
CREATE TABLE sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_number VARCHAR(50) UNIQUE NOT NULL,
  branch_id INT NOT NULL,
  customer_id INT,
  user_id INT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `sale_number`
- FOREIGN KEY: `branch_id`, `customer_id`, `user_id`
- INDEX: `created_at`

---

### Sale Items Table

Stores individual items in a sale.

```sql
CREATE TABLE sale_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  batch_id INT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (batch_id) REFERENCES inventory(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `sale_id`, `product_id`, `batch_id`

---

### Customers Table

Stores customer information and credit management.

```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  credit_used DECIMAL(15,2) DEFAULT 0,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `email`, `phone`

---

### Prescriptions Table

Stores prescription records.

```sql
CREATE TABLE prescriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  prescriber_id INT NOT NULL,
  status ENUM('active', 'dispensed', 'expired', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATE,
  FOREIGN KEY (patient_id) REFERENCES customers(id),
  FOREIGN KEY (prescriber_id) REFERENCES users(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `prescription_number`
- FOREIGN KEY: `patient_id`, `prescriber_id`

---

### GRN Table

Stores Goods Received Notes.

```sql
CREATE TABLE grn (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  branch_id INT NOT NULL,
  supplier_id INT NOT NULL,
  invoice_number VARCHAR(100),
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `grn_number`
- FOREIGN KEY: `branch_id`, `supplier_id`

---

### Insurance Claims Table

Stores insurance claim records.

```sql
CREATE TABLE insurance_claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  claim_amount DECIMAL(15,2) NOT NULL,
  approved_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
  insurance_provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES customers(id)
);
```

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `claim_number`
- FOREIGN KEY: `patient_id`

---

## Transfer Tables

### Transfer Requests Table

```sql
CREATE TABLE transfer_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  source_branch_id INT NOT NULL,
  destination_branch_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  priority ENUM('urgent', 'normal', 'low') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_branch_id) REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id)
);
```

---

### Transfer Orders Table

```sql
CREATE TABLE transfer_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  transfer_request_id INT,
  source_branch_id INT NOT NULL,
  destination_branch_id INT NOT NULL,
  status ENUM('created', 'dispatched', 'received', 'verified') DEFAULT 'created',
  dispatched_at TIMESTAMP NULL,
  received_at TIMESTAMP NULL,
  FOREIGN KEY (transfer_request_id) REFERENCES transfer_requests(id),
  FOREIGN KEY (source_branch_id) REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id)
);
```

---

### Inter-Branch Settlements Table

```sql
CREATE TABLE inter_branch_settlements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  settlement_month DATE NOT NULL,
  value_sent DECIMAL(15,2) DEFAULT 0,
  value_received DECIMAL(15,2) DEFAULT 0,
  net_settlement DECIMAL(15,2) DEFAULT 0,
  status ENUM('owed_to_corporate', 'owed_from_corporate', 'balanced') DEFAULT 'balanced',
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  UNIQUE KEY (branch_id, settlement_month)
);
```

---

## Indexing Strategy

### Performance Indexes

```sql
-- Foreign keys
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_branch_manager ON branches(manager_id);
CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Search
CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_customer_phone ON customers(phone);
CREATE INDEX idx_product_category ON products(category);

-- Date ranges
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_grn_created ON grn(created_at);
CREATE INDEX idx_claims_created ON insurance_claims(created_at);
```

---

## Data Integrity Constraints

### Foreign Key Constraints

All foreign keys enforce referential integrity with:
- `ON DELETE RESTRICT` - Prevent deletion of referenced records
- `ON UPDATE CASCADE` - Update child records when parent changes

### Unique Constraints

- `users.email` - One email per user
- `branches.name` - One branch name
- `products.generic_name` - One product per generic name
- `sales.sale_number` - Unique receipt numbers
- `prescriptions.prescription_number` - Unique prescription IDs
- `grn.grn_number` - Unique GRN numbers

---

## Backup & Recovery

### Backup Strategy

- Daily full backups at 2 AM
- 30-day retention policy
- Location: `/backups/pharmacy-pos/`

### Recovery Procedure

```bash
mysql -u root -p pharmacy_pos < backup_file.sql
```

---

## Monitoring

### Key Metrics

- Table sizes and growth rate
- Query performance (slow query log)
- Connection pool utilization
- Replication lag (if applicable)

### Maintenance Tasks

- Weekly: Optimize tables
- Monthly: Analyze query performance
- Quarterly: Archive old data
- Annually: Full backup verification

---

*Last Updated: April 27, 2026*
