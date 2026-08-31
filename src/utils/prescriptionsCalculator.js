// utils/prescriptionsCalculator.js
//
// Single source of truth for turning a prescription line (dosage + frequency +
// duration) into a real quantity and price, given the matched inventory item.
//
// Rules (locked in with pharmacist, Aug 2026):
//  - TABLET:    quantity = amount x timesPerDay x days. Billed & stocked exactly.
//  - SYRUP:     bottles go home with the patient, never reused. Round UP to
//               whole bottles for both billing and stock. The *prescribed* ml
//               is still tracked separately so charts show the real dose.
//  - INJECTION: administered in-house, vial stays open between patients.
//               Billed and stocked at the EXACT ml/IU used — no rounding.

export const FREQUENCY_TIMES_PER_DAY = {
  STAT: 1,
  dly: 1,
  'b.d': 2,
  tds: 3,
  qds: 4,
  hly: 24,
  '4hly': 6,
  '6hly': 4,
  '8hly': 3,
  '12hly': 2,
  '24hly': 1,
};

export const DURATION_DAYS = {
  '1/7': 1, '2/7': 2, '3/7': 3, '4/7': 4, '5/7': 5, '6/7': 6,
  '1/52': 7, '2/52': 14, '3/52': 21,
  '1/12': 30, '2/12': 60, '3/12': 90, '4/12': 120, '5/12': 150, '6/12': 180,
  '1yr': 365,
};

export function getDoseCount(frequency, duration) {
  if (frequency === 'STAT') return 1;
  const timesPerDay = FREQUENCY_TIMES_PER_DAY[frequency] ?? 1;
  const days = DURATION_DAYS[duration] ?? 1;
  return timesPerDay * days;
}

// Kept for backward compatibility with existing call sites (e.g. ViewConsultation's
// getBillItems) that only pass frequency+duration with no dosage amount.
export function calculateDispenseQuantity(frequency, duration) {
  return getDoseCount(frequency, duration);
}

// Converts a dosage entered in `dosageUnit` into the inventory item's own
// `unit`. Returns null if the conversion isn't possible (e.g. mg requested
// but the drug has no concentration set in inventory).
function convertToInventoryUnit(amount, dosageUnit, inventory) {
  if (!inventory) return null;
  const invUnit = inventory.unit || 'tablet';
  if (dosageUnit === invUnit) return amount;
  if (dosageUnit === 'mg') {
    const { concentrationAmount, concentrationPer } = inventory;
    if (!concentrationAmount || !concentrationPer) return null;
    // e.g. 500mg per 1 tablet -> tablets = (doseMg / 500) * 1
    // or 250mg per 5ml -> ml = (doseMg / 250) * 5
    // or 50mg per 1 ampoule -> ampoules = (doseMg / 50) * 1
    return (amount / concentrationAmount) * concentrationPer;
  }
  return null;
}

/**
 * @param {Object} params
 * @param {'tablet'|'syrup'|'injection'} params.medicationType
 * @param {number} params.dosageAmount
 * @param {string} params.dosageUnit  e.g. 'tablet' | 'ml' | 'iu' | 'mg'
 * @param {string} params.frequency
 * @param {string} params.duration
 * @param {Object|null} params.inventory  matched inventory record (unit, packSize, sellingPrice, concentration*)
 */
export function calculatePrescriptionLine({
  medicationType,
  dosageAmount,
  dosageUnit,
  frequency,
  duration,
  inventory,
}) {
  const doseCount = getDoseCount(frequency, duration);
  const totalDosageUnits = Number(dosageAmount || 0) * doseCount;

  if (!inventory) {
    return {
      prescribedQuantity: totalDosageUnits,
      billedQuantity: null,
      unit: dosageUnit,
      unitPrice: 0,
      lineTotal: 0,
      convertible: true,
    };
  }

  const totalInInventoryUnit = convertToInventoryUnit(totalDosageUnits, dosageUnit, inventory);
  if (totalInInventoryUnit === null) {
    return {
      prescribedQuantity: totalDosageUnits,
      billedQuantity: null,
      unit: dosageUnit,
      unitPrice: 0,
      lineTotal: 0,
      convertible: false,
    };
  }

  const packSize = Number(inventory.packSize) || 1;
  const sellingPrice = Number(inventory.sellingPrice) || 0;
  const unitPrice = packSize > 0 ? sellingPrice / packSize : 0;
  const invUnit = inventory.unit || 'tablet';

   if (medicationType === 'syrup') {
    const bottlesNeeded = Math.ceil(totalInInventoryUnit / packSize) || 0;
    const billedQuantity = bottlesNeeded * packSize;
    return {
      prescribedQuantity: totalInInventoryUnit,
      billedQuantity,
      bottlesNeeded,
      unit: invUnit,
      unitPrice,
      lineTotal: bottlesNeeded * sellingPrice,
      convertible: true,
    };
  }

  if (medicationType === 'injection' && invUnit !== 'ampoule') {
    // Shared vial (ml/iu) — bill the exact fractional amount, nothing wasted.
    return {
      prescribedQuantity: totalInInventoryUnit,
      billedQuantity: totalInInventoryUnit,
      unit: invUnit,
      unitPrice,
      lineTotal: totalInInventoryUnit * unitPrice,
      convertible: true,
    };
  }

  // tablet, or injection with invUnit === 'ampoule': discrete, non-returnable
  // units — round up, price = pack price / units-per-pack.
  const quantity = Math.ceil(totalInInventoryUnit);
  return {
    prescribedQuantity: quantity,
    billedQuantity: quantity,
    unit: invUnit,
    unitPrice,
    lineTotal: quantity * unitPrice,
    convertible: true,
  };
}