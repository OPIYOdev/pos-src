/**
 * RX-VER-001: Prescription Validation
 * Returns { isValid, errors[], warnings[], pharmacistOverrideRequired }
 */

function validatePrescription(prescription, patientProfile) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    pharmacistOverrideRequired: false,
  };

  // --- Mandatory field checks ---
  if (!prescription.prescriberLicenseNumber) {
    result.errors.push('Missing prescriber license number');
    result.isValid = false;
  }

  // Standard prescriptions expire after 6 months (180 days)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  if (new Date(prescription.date) < sixMonthsAgo) {
    result.errors.push('Prescription exceeds 6 months validity');
    result.isValid = false;
  }

  // --- Per-item checks ---
  for (const item of prescription.items) {
    // Drug-drug interaction check
    const interactions = checkDrugInteractions(
      item.drugId,
      patientProfile.currentMedications
    );
    if (interactions.length > 0) {
      result.warnings.push(`Interaction: ${interactions.join(', ')}`);
      result.pharmacistOverrideRequired = true;
    }

    // Allergy check
    if (patientProfile.allergies.includes(item.drugIngredient)) {
      result.errors.push(`Patient allergic to ${item.drugIngredient}`);
      result.isValid = false;
    }
  }

  return result;
}

/**
 * RX-REP-001: Chronic Disease Auto-Tagging
 * Tags patient and schedules refill reminders if chronic criteria met.
 */
function autoTagChronicDisease(patient, prescription) {
  const chronicCategories = [
    'Hypertension', 'Diabetes', 'Asthma',
    'Epilepsy', 'HIV/AIDS', 'TB', 'Mental Health',
  ];

  const prescriptionDuration = calculateDurationInDays(
    prescription.startDate,
    prescription.endDate
  );

  const isChronicMedication = chronicCategories.includes(prescription.drugCategory);

  if (prescriptionDuration > 90 || isChronicMedication) {
    patient.chronic_disease_tag = true;
    patient.chronicConditions = [
      ...new Set([...patient.chronicConditions, prescription.drugCategory]),
    ];

    scheduleRefillReminders(patient, prescription, 7);       // 7-day lead
    enrollInLoyaltyProgram(patient, 'Chronic Care Tier');
    generateAdherencePlan(patient, prescription);
  }

  return patient;
}

module.exports = { validatePrescription, autoTagChronicDisease };
