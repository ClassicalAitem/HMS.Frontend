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
  mane: 1,
  nocte: 1,
  prn: 1,
  'alt die': 0.5,
};

export const DURATION_DAYS = {
  '1/7': 1, '2/7': 2, '3/7': 3, '4/7': 4, '5/7': 5, '6/7': 6,
  '1/52': 7, '2/52': 14, '3/52': 21,
  '1/12': 30, '2/12': 60, '3/12': 90, '4/12': 120, '5/12': 150, '6/12': 180,
  '1yr': 365,
};

export function buildDurationString(amount, unit) {
  const n = Number(amount);
  if (!n || n <= 0) return '';

  switch (unit) {
    case 'day': return `${n}/7`;
    case 'week': return `${n}/52`;
    case 'month': return `${n}/12`;
    case 'year': return `${n}yr`;
    default: return '';
  }
}

export function parseDurationParts(duration) {
  if (!duration) return { amount: '', unit: 'day' };
  const str = String(duration).trim();
  const yrMatch = str.match(/^(\d+)yr$/);
  if (yrMatch) return { amount: Number(yrMatch[1]), unit: 'year' };

  const fracMatch = str.match(/^(\d+)\/(7|52|12)$/);
  if (fracMatch) {
    const n = Number(fracMatch[1]);
    const denom = Number(fracMatch[2]);
    return {
      amount: n,
      unit: denom === 7 ? 'day' : denom === 52 ? 'week' : 'month',
    };
  }

  return { amount: '', unit: 'day' };
}

export function parseDurationDays(duration) {
  if (!duration) return 1;
  const str = String(duration).trim();
  const yrMatch = str.match(/^(\d+)yr$/);
  if (yrMatch) return Number(yrMatch[1]) * 365;

  const fracMatch = str.match(/^(\d+)\/(7|52|12)$/);
  if (fracMatch) {
    const n = Number(fracMatch[1]);
    const denom = Number(fracMatch[2]);
    if (denom === 7) return n;
    if (denom === 52) return n * 7;
    if (denom === 12) return n * 30;
  }

  return DURATION_DAYS[str] ?? 1;
}

export function getDoseCount(frequency, duration) {
  if (frequency === 'STAT') return 1;
  const timesPerDay = FREQUENCY_TIMES_PER_DAY[frequency] ?? 1;
  const days = parseDurationDays(duration);
  return Math.ceil(timesPerDay * days);
}

// Kept for backward compatibility with existing call sites (e.g. ViewConsultation's
// getBillItems) that only pass frequency+duration with no dosage amount.
export function calculateDispenseQuantity(frequency, duration) {
  return getDoseCount(frequency, duration);
}

// Parses a strength string into a concentration { amount, per }.
// Handles the two formats seen in inventory data:
//   "500mg"       -> 500mg per 1 unit (tablet/ampoule/etc.)
//   "125mg/5ml"   -> 125mg per 5 ml (syrups/suspensions)
// Returns null if the string doesn't match either shape (bare numbers like
// "400" with no unit, IU strengths like "10IU", blank strings, etc.) —
// those genuinely can't be converted without a doctor/pharmacist clarifying.
export function parseStrengthConcentration(strength) {
  if (!strength) return null;
  const str = String(strength).trim();

  const ratioMatch = str.match(/^([\d.]+)\s*mg\s*\/\s*([\d.]+)\s*ml$/i);
  if (ratioMatch) {
    const amount = Number(ratioMatch[1]);
    const per = Number(ratioMatch[2]);
    return amount > 0 && per > 0 ? { amount, per } : null;
  }

  const simpleMatch = str.match(/^([\d.]+)\s*mg$/i);
  if (simpleMatch) {
    const amount = Number(simpleMatch[1]);
    return amount > 0 ? { amount, per: 1 } : null;
  }

  return null;
}

// Parses a dosage string such as "2 tablets", "500mg", "5 ml", or "1/2 tablet"
// into a numeric amount + normalized unit used by the billing calculator.
export function parseDosageString(dosage) {
  if (dosage === null || dosage === undefined || dosage === '') {
    return { amount: 0, unit: '' };
  }

  const str = String(dosage).trim();
  if (!str) return { amount: 0, unit: '' };

  const match = str.match(/^([\d.]+(?:\/\d+(?:\.\d+)?)?)\s*([A-Za-z]+)?$/i);
  if (!match) {
    return { amount: 0, unit: '' };
  }

  const rawAmount = match[1];
  const rawUnit = (match[2] || '').toLowerCase();

  let amount = Number(rawAmount);
  if (rawAmount.includes('/')) {
    const [numerator, denominator] = rawAmount.split('/');
    const parsedNumerator = Number(numerator);
    const parsedDenominator = Number(denominator);
    amount = parsedDenominator ? parsedNumerator / parsedDenominator : 0;
  }

  const normalizedUnit = (() => {
    const map = {
      tablet: 'tablet',
      tablets: 'tablet',
      tab: 'tablet',
      tabs: 'tablet',
      capsule: 'capsule',
      capsules: 'capsule',
      ampoule: 'ampoule',
      ampoules: 'ampoule',
      ml: 'ml',
      millilitre: 'ml',
      milliliter: 'ml',
      mg: 'mg',
      microgram: 'mcg',
      micrograms: 'mcg',
      mcg: 'mcg',
      iu: 'iu',
      unit: 'iu',
      units: 'iu',
      drop: 'ml',
      drops: 'ml',
      gtt: 'ml',
      gtts: 'ml',
      teaspoon: 'ml',
      teaspoons: 'ml',
      tablespoon: 'ml',
      tablespoons: 'ml',
    };

    if (!rawUnit) return '';
    return map[rawUnit] || rawUnit.replace(/s$/, '');
  })();

  return { amount: Number.isFinite(amount) ? amount : 0, unit: normalizedUnit };
}

// Explicit concentrationAmount/concentrationPer on the inventory item always
// wins (lets a pharmacist override/correct a weird strength string). Falls
// back to parsing `strength` when those aren't set.
function getConcentration(inventory) {
  if (inventory?.concentrationAmount && inventory?.concentrationPer) {
    return {
      amount: Number(inventory.concentrationAmount),
      per: Number(inventory.concentrationPer),
    };
  }
  return parseStrengthConcentration(inventory?.strength);
}

// Exported so the UI can decide whether to show "mg" as a dosing option
// using the exact same rule the calculator uses to convert it.
export function hasConcentrationData(inventory) {
  return !!getConcentration(inventory);
}

// Converts a dosage entered in `dosageUnit` into the inventory item's own
// `unit`. Returns null if the conversion isn't possible (e.g. mg requested
// but the drug has no concentration set in inventory).
function convertToInventoryUnit(amount, dosageUnit, inventory) {
  if (!inventory || !inventory.unit) return null;
  const invUnit = inventory.unit;
  if (dosageUnit === invUnit) return amount;
  if (dosageUnit === 'mg') {
    const concentration = getConcentration(inventory);
    if (!concentration) return null;
    return (amount / concentration.amount) * concentration.per;
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

  if (!inventory.unit) {
    return {
      prescribedQuantity: totalDosageUnits,
      billedQuantity: null,
      unit: dosageUnit,
      unitPrice: 0,
      lineTotal: 0,
      convertible: false,
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
  const invUnit = inventory.unit;

   if (medicationType === 'syrup' || medicationType === 'gutt' || medicationType === 'infusion') {
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