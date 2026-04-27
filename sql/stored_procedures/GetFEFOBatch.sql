-- ============================================================
-- Stored Procedure: GetFEFOBatch
-- Procedure: INV-FEFO-001
-- Returns the earliest-expiring batch with sufficient stock
-- ============================================================

DELIMITER $$

CREATE PROCEDURE GetFEFOBatch (
  IN  p_drug_id  INT,
  IN  p_quantity INT
)
BEGIN
  SELECT
    batch_number,
    expiry_date,
    quantity_available,
    selling_price
  FROM  inventory_batches
  WHERE drug_id           = p_drug_id
    AND quantity_available >= p_quantity
    AND expiry_date        >= CURDATE()
    AND is_quarantined     = 0
  ORDER BY expiry_date ASC
  LIMIT 1;
END$$

DELIMITER ;
