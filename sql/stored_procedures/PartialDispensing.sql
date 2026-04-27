-- ============================================================
-- Partial Dispensing Protocol
-- Procedure: POS-PRS-001
-- Triggered when: stock_available < prescribed_quantity
-- ============================================================

-- Step 1: Dispense available quantity
INSERT INTO dispensing_record (sale_id, drug_id, quantity_dispensed, batch_id)
VALUES (@sale_id, @drug_id, @stock_available, @batch_id);

-- Step 2: Create backorder record (expires in 30 days)
INSERT INTO backorder (patient_id, drug_id, balance_quantity, created_date, expiry_date)
VALUES (
  @patient_id,
  @drug_id,
  (@prescribed_quantity - @stock_available),
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY)
);

-- Step 3: Notify patient via SMS
CALL send_sms_notification(
  @patient_phone,
  CONCAT(
    'Your order is partially ready. Balance: ',
    CAST(@balance AS CHAR),
    ' units'
  )
);

-- ============================================================
-- Monthly Insurance Reconciliation Query
-- Procedure: INS-REC-001
-- Run: Every 5th working day of the month
-- ============================================================

SELECT
  i.scheme_name,
  COUNT(c.id)                                                              AS total_claims,
  SUM(c.insurance_amount)                                                  AS total_amount,
  SUM(CASE WHEN c.status = 'PAID'     THEN c.insurance_amount ELSE 0 END) AS paid_amount,
  SUM(CASE WHEN c.status = 'REJECTED' THEN c.insurance_amount ELSE 0 END) AS rejected_amount,
  SUM(CASE WHEN c.status = 'PENDING'  THEN c.insurance_amount ELSE 0 END) AS pending_amount,
  AVG(DATEDIFF(c.payment_date, c.submission_date))                         AS avg_payment_days
FROM  insurance_claims c
JOIN  insurance_members m  ON c.member_id  = m.id
JOIN  insurance_schemes i  ON m.scheme_id  = i.id
WHERE MONTH(c.submission_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
  AND YEAR(c.submission_date)  = YEAR(CURDATE()  - INTERVAL 1 MONTH)
GROUP BY i.id, i.scheme_name;
