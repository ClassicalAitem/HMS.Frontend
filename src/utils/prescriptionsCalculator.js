// utils/prescriptionsCalculator.js
//
// Single source of truth for turning a prescription line (dosage + frequency +
// duration) into a real quantity and price, given the matched inventory item.
//
// Rules:
//  - TABLET:    quantity = amount x timesPerDay x days. Billed & stocked exactly.
//  - SYRUP:     bottles go home with the patient, never reused. Round UP to
//               whole bottles for both billing and stock. The *prescribed* ml
//               is still tracked separately so charts show the real dose.
//  - INJECTION: both ampoule and vial injections are billed for whole bottles/containers
//               (regardless of partial use, e.g. 6ml out of 10ml vial -> 1 bottle,
//               12ml out of 10ml -> 2 bottles). The prescribed amount stays intact.
//               EXEMPTIONS: specific inventory IDs configured in EXEMPT_INJECTION_IDS
//               are billed and stocked per ml based on exact fractional volume used.

export const EXEMPT_INJECTION_IDS = new Set([
  '69e735e954bcf5acd5e9a673', // Streptomycin
  '69a0c2248e0a0d2588c3b05c', // Paracetamol
  '6accee22b9b47d4ff44adc46', // Vitamin B- COMPLEX
  '69e735e654bcf5acd5e9a5d6', // Chloroquine (production)
  '6ae24e45d94eb5a3cd3a0b58', // Chloroquine (development/test)
]);

export function isExemptInjection(inventory) {
  if (!inventory) return false;
  const id = String(inventory._id || inventory.id || inventory.inventoryId || '');
  return Boolean(id && EXEMPT_INJECTION_IDS.has(id));
}

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
export function isSingleUnitDispense(medicationType, inventory) {
  const type = String(medicationType || "").toLowerCase();
  if (["cream", "gutt", "syrup"].includes(type)) {
    return true;
  }
  const form = String(inventory?.form || "").toLowerCase();
  const unit = String(inventory?.unit || "").toLowerCase();
  const name = String(inventory?.name || "").toLowerCase();

  if (unit === "tube") return true;

  const singleKeywords = [
    "cream", "ointment", "gel", "lotion", "tube",
    "drop", "drops", "eye drop", "ear drop", "nasal drop", "gutt",
    "spray", "inhaler", "inhalation",
    "syrup", "suspension", "oral syrup", "oral suspension",
    "mouthwash", "shampoo", "lacquer"
  ];

  return singleKeywords.some((keyword) => form.includes(keyword) || name.includes(keyword));
}

// Kept for backward compatibility with existing call sites
export function calculateDispenseQuantity(frequency, duration, medOrType, inventory) {
  if (medOrType) {
    const medType = typeof medOrType === "string" ? medOrType : medOrType?.medicationType;
    const inv = inventory || (typeof medOrType === "object" ? medOrType : null);
    if (isSingleUnitDispense(medType, inv)) {
      return 1;
    }
  }
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

  const ratioMatch = str.match(/^([\d.]+)\s*(g|mg|mcg)\s*\/\s*([\d.]+)\s*ml$/i);
  if (ratioMatch) {
    const amount = Number(ratioMatch[1]);
    const unit = ratioMatch[2].toLowerCase();
    const per = Number(ratioMatch[3]);
    return amount > 0 && per > 0 ? { amount, per, unit } : null;
  }

  const simpleMatch = str.match(/^([\d.]+)\s*(g|mg|mcg)$/i);
  if (simpleMatch) {
    const amount = Number(simpleMatch[1]);
    const unit = simpleMatch[2].toLowerCase();
    return amount > 0 ? { amount, per: 1, unit } : null;
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
      g: 'g',
      gram: 'g',
      grams: 'g',
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
    let savedUnit = (inventory.concentrationUnit || 'mg').toLowerCase();
    // Fix for old corrupted data that incorrectly saved the volume unit as the weight unit
    if (['ml', 'tablet', 'ampoule', 'iu', 'tube', 'unit'].includes(savedUnit)) {
      savedUnit = 'mg'; 
    }
    return {
      amount: Number(inventory.concentrationAmount),
      per: Number(inventory.concentrationPer),
      unit: savedUnit,
    };
  }
  return parseStrengthConcentration(inventory?.strength);
}

// Exported so the UI can decide whether to show "mg" as a dosing option
// using the exact same rule the calculator uses to convert it.
export function hasConcentrationData(inventory) {
  return !!getConcentration(inventory);
}

function getBaseMgWeight(amount, unit) {
  if (unit === 'g') return amount * 1000;
  if (unit === 'mg') return amount;
  if (unit === 'mcg') return amount / 1000;
  return null;
}

export function getInjectionCapacity(inventory) {
  if (!inventory) return 1;
  const conc = getConcentration(inventory);
  const concPer = conc?.per ? Number(conc.per) : 0;
  const rawPackSize = Number(inventory.packSize);

  // If packSize is explicitly entered and > 1 (e.g. 30ml bottle of Chloroquine or 10ml vial)
  if (rawPackSize > 1) {
    return rawPackSize;
  }
  // Otherwise if concentration specifies the volume (e.g. 2ml in 50mg/2ml, or 10ml in 5g/10ml)
  if (concPer > 0) {
    return concPer;
  }
  return rawPackSize > 0 ? rawPackSize : 1;
}

// Converts a dosage entered in `dosageUnit` into the inventory item's own
// `unit`. Returns null if the conversion isn't possible (e.g. mg requested
// but the drug has no concentration set in inventory).
function convertToInventoryUnit(amount, dosageUnit, inventory) {
  if (!inventory || !inventory.unit) return null;
  const invUnit = inventory.unit;
  if (dosageUnit === invUnit) return amount;

  // Cross conversion for injections (ampoule vs ml)
  if ((invUnit === 'ampoule' || invUnit === 'ml') && (dosageUnit === 'ml' || dosageUnit === 'ampoule')) {
    const containerVolume = getInjectionCapacity(inventory);
    if (invUnit === 'ampoule' && dosageUnit === 'ml') {
      return amount / containerVolume;
    }
    if (invUnit === 'ml' && dosageUnit === 'ampoule') {
      return amount * containerVolume;
    }
  }

  const dosageMg = getBaseMgWeight(amount, dosageUnit);
  if (dosageMg !== null) {
    const concentration = getConcentration(inventory);
    if (!concentration) return null;

    const concMg = getBaseMgWeight(concentration.amount, concentration.unit || 'mg');
    if (concMg !== null && concMg > 0) {
      const volumeMl = (dosageMg / concMg) * concentration.per;
      if (invUnit === 'ampoule') {
        const containerVolume = getInjectionCapacity(inventory);
        return volumeMl / containerVolume;
      }
      return volumeMl;
    }
  }

  return null;
}

/**
 * @param {Object} params
 * @param {'tablet'|'syrup'|'injection'|'cream'|'gutt'|'infusion'} params.medicationType
 * @param {number} params.dosageAmount
 * @param {string} params.dosageUnit  e.g. 'tablet' | 'ml' | 'iu' | 'mg' | 'tube'
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
  const isSingle = isSingleUnitDispense(medicationType, inventory);

  if (!inventory) {
    const doseCount = getDoseCount(frequency, duration);
    const totalDosageUnits = Number(dosageAmount || 0) * doseCount;
    const qty = isSingle ? 1 : (totalDosageUnits || 1);
    return {
      prescribedQuantity: qty,
      billedQuantity: qty,
      unit: dosageUnit,
      unitPrice: 0,
      lineTotal: 0,
      convertible: true,
      isSingleUnit: isSingle,
    };
  }

  const packSize = Number(inventory.packSize) || 1;
  const sellingPrice = Number(inventory.sellingPrice) || 0;
  const rawUnit = inventory.unit || "";

  // 1. Single-unit / container items (cream, tube, eye drop, ear drop, suspension, syrup, etc.)
  // Dispensed 1 by 1. The price is charged ONCE (sellingPrice, the pack/container price).
  if (isSingle) {
    const isContainerUnit = ["tube", "bottle", "pack"].includes(String(dosageUnit).toLowerCase());
    const containers = isContainerUnit && Number(dosageAmount) > 1
      ? Math.round(Number(dosageAmount))
      : 1;

    let displayUnit = "unit";
    const formLower = String(inventory.form || "").toLowerCase();
    if (medicationType === "cream" || rawUnit === "tube" || formLower.includes("cream") || formLower.includes("ointment") || formLower.includes("gel")) {
      displayUnit = "tube";
    } else if (["syrup", "gutt"].includes(medicationType) || ["drop", "syrup", "suspension", "solution", "spray", "inhaler"].some(k => formLower.includes(k))) {
      displayUnit = "bottle";
    } else {
      displayUnit = rawUnit || "unit";
    }

    const stockDeductionQty = rawUnit === "ml" && packSize > 1
      ? containers * packSize
      : containers;

    return {
      prescribedQuantity: containers,
      billedQuantity: containers,
      bottlesNeeded: containers,
      unit: displayUnit,
      unitPrice: sellingPrice,
      lineTotal: containers * sellingPrice,
      stockDeductionQty,
      convertible: true,
      isSingleUnit: true,
    };
  }

  // 2. Multi-dose discrete units (tablets, capsules, injections)
  const doseCount = getDoseCount(frequency, duration);
  const totalDosageUnits = Number(dosageAmount || 0) * doseCount;

  if (!inventory.unit) {
    return {
      prescribedQuantity: totalDosageUnits,
      billedQuantity: null,
      unit: dosageUnit,
      unitPrice: 0,
      lineTotal: 0,
      convertible: false,
      isSingleUnit: false,
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
      isSingleUnit: false,
    };
  }

  function resolveInventoryUnit(medType, inv) {
    const r = inv?.unit;
    if (medType === "tablet" || medType === "cream" || medType === "sublingual") {
      return r === "tube" ? "tube" : (r || "tablet");
    }
    if (medType === "rectal") {
      return r || "suppository";
    }
    if (medType === "syrup" || medType === "gutt" || medType === "infusion") {
      return "ml";
    }
    if (medType === "injection" || medType === "subcutaneous") {
      if (r === "iu" || r === "ampoule") return r;
      return "ml";
    }
    return r || "unit";
  }

  const invUnit = resolveInventoryUnit(medicationType, inventory);
  const unitPrice = packSize > 0 ? sellingPrice / packSize : 0;

  const isInjection = medicationType === "injection" || medicationType === "subcutaneous";

  if (isInjection) {
    const isExempt = isExemptInjection(inventory);
    const containerCapacity = getInjectionCapacity(inventory);

    if (isExempt) {
      // Exempt injection (shared vial) — bill the exact fractional amount (per ml)
      const totalInMl = invUnit === 'ampoule' ? totalInInventoryUnit * containerCapacity : totalInInventoryUnit;
      const perMlPrice = containerCapacity > 0 ? sellingPrice / containerCapacity : sellingPrice;
      const lineTotal = totalInMl * perMlPrice;
      return {
        prescribedQuantity: totalInMl,
        billedQuantity: totalInMl,
        bottlesNeeded: null,
        unit: 'ml',
        unitPrice: perMlPrice,
        lineTotal,
        stockDeductionQty: invUnit === 'ampoule' ? totalInInventoryUnit : totalInMl,
        convertible: true,
        isSingleUnit: false,
        isExemptInjection: true,
      };
    }

    // Standard injection (both ampoules and vials) — patient pays for whole container(s).
    // If invUnit is 'ampoule', totalInInventoryUnit is already in ampoules!
    // If invUnit is 'ml', totalInInventoryUnit is in ml, so divide by containerCapacity.
    const divisor = invUnit === 'ampoule' ? 1 : (containerCapacity > 0 ? containerCapacity : 1);
    const containers = totalInInventoryUnit > 0 ? Math.ceil(totalInInventoryUnit / divisor) : 0;
    const lineTotal = containers * sellingPrice;
    const displayUnit = invUnit === "ampoule" ? "ampoule" : "bottle";

    return {
      prescribedQuantity: totalInInventoryUnit,
      billedQuantity: containers,
      bottlesNeeded: containers,
      displayUnit,
      unit: invUnit,
      unitPrice: sellingPrice,
      lineTotal,
      stockDeductionQty: invUnit === "ampoule" ? containers : (rawUnit === "ml" && containerCapacity > 1 ? containers * containerCapacity : containers),
      convertible: true,
      isSingleUnit: false,
      isExemptInjection: false,
    };
  }

  // Tablet, capsule, suppository: discrete, non-returnable units
  const quantity = Math.ceil(totalInInventoryUnit);
  return {
    prescribedQuantity: quantity,
    billedQuantity: quantity,
    unit: invUnit,
    unitPrice,
    lineTotal: quantity * unitPrice,
    stockDeductionQty: quantity,
    convertible: true,
    isSingleUnit: false,
  };
}

/**
 * Parses freeform or delimited prescription string into structured components.
 * Example: "Vitamin C, 100 mg, tds, (after meal)"
 * Output: { drugName: 'Vitamin C', dosage: '100 mg', frequency: 'tds', duration: '', instructions: 'after meal' }
 */
export function parseMedicationString(medStr) {
  if (!medStr || typeof medStr !== 'string') {
    return { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' };
  }

  const delimiter = medStr.includes('|') ? '|' : ',';
  const rawParts = medStr.split(delimiter).map((s) => s.trim()).filter(Boolean);

  if (rawParts.length <= 1) {
    return { drugName: medStr.trim(), dosage: '', frequency: '', duration: '', instructions: '' };
  }

  const result = {
    drugName: rawParts[0] || '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  };

  const remaining = rawParts.slice(1);
  const knownFrequencies = new Set([
    'stat', 'dly', 'daily', 'b.d', 'bd', 'tds', 't.d.s', 'qds', 'q.d.s',
    'mane', 'nocte', 'prn', 'alt die', 'hly', '4hly', '6hly', '8hly', '12hly', '24hly'
  ]);

  for (const part of remaining) {
    const lower = part.toLowerCase().replace(/[()]/g, '').trim();

    if (part.startsWith('(') && part.endsWith(')')) {
      result.instructions = part.slice(1, -1).trim();
      continue;
    }
    if (
      lower.includes('meal') ||
      lower.includes('food') ||
      lower.includes('water') ||
      lower.includes('bedtime') ||
      lower.includes('empty stomach') ||
      lower.includes('needed')
    ) {
      result.instructions = part.replace(/[()]/g, '').trim();
      continue;
    }

    if (lower.startsWith('for ') || /^\d+\s*(day|week|month|yr|year|hr|hour)s?$/i.test(lower)) {
      result.duration = part.replace(/^for\s+/i, '').trim();
      continue;
    }

    if (knownFrequencies.has(lower) || knownFrequencies.has(lower.replace(/\./g, ''))) {
      result.frequency = part;
      continue;
    }

    if (/^\d+(\.\d+)?\s*(mg|g|ml|tablet|tab|cap|capsule|suppository|drop|drops|bottle|iu|ampoule|tube|puffs?)s?$/i.test(lower)) {
      result.dosage = part;
      continue;
    }

    if (!result.dosage && /^\d/.test(part)) {
      result.dosage = part;
    } else if (!result.frequency && knownFrequencies.has(lower.replace(/\./g, ''))) {
      result.frequency = part;
    } else if (!result.instructions) {
      result.instructions = part.replace(/[()]/g, '').trim();
    }
  }

  return result;
}
