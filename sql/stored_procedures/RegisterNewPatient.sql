-- ============================================================
-- Stored Procedure: RegisterNewPatient
-- Procedure: CUST-REG-001
-- Patient ID format: PAT-{YYYY}-{000001}
-- ============================================================

DELIMITER $$

CREATE PROCEDURE RegisterNewPatient (
  IN p_full_name         VARCHAR(255),
  IN p_id_number         VARCHAR(50),
  IN p_dob               DATE,
  IN p_phone             VARCHAR(20),
  IN p_email             VARCHAR(255),
  IN p_residential_area  VARCHAR(100),
  IN p_registered_by     INT
)
BEGIN
  DECLARE v_patient_id       VARCHAR(50);
  DECLARE v_duplicate_count  INT;

  -- Duplicate check
  SELECT COUNT(*) INTO v_duplicate_count
  FROM   customers
  WHERE  id_number = p_id_number;

  IF v_duplicate_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Patient with this ID already exists';
  END IF;

  -- Generate sequential patient ID
  SET v_patient_id = CONCAT(
    'PAT-',
    YEAR(CURDATE()),
    '-',
    LPAD((SELECT COUNT(*) + 1 FROM customers), 6, '0')
  );

  -- Insert patient record
  INSERT INTO customers (
    patient_id, full_name, id_number, date_of_birth,
    phone, email, residential_area, registration_date,
    registered_by, is_active, created_at
  ) VALUES (
    v_patient_id, p_full_name, p_id_number, p_dob,
    p_phone, p_email, p_residential_area, NOW(),
    p_registered_by, TRUE, NOW()
  );

  -- Queue welcome SMS
  INSERT INTO sms_queue (recipient, message, status, created_at)
  VALUES (
    p_phone,
    CONCAT(
      'Welcome to Pharmacy POS, ', p_full_name,
      '! Your patient ID is ', v_patient_id,
      '. Show this for faster service.'
    ),
    'PENDING',
    NOW()
  );

  SELECT v_patient_id AS patient_id;
END$$

DELIMITER ;
