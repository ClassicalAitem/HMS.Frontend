/**
 * Evaluates a lab result value against its reference range and returns an appropriate CSS color class.
 * 
 * @param {string|number} value - The actual lab result value
 * @param {string} rangeText - The range text containing min and max, e.g., 'g/dl (11-16)'
 * @returns {string} Tailwind CSS class for text color
 */
export const getLabResultColor = (value, rangeText) => {
  if (!value || !rangeText) return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return ''; // Cannot evaluate non-numeric values

  // Look for pattern like (11-16) or (4.0-10.0)
  const match = rangeText.match(/\(([\d.]+)\s*-\s*([\d.]+)\)/);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);

    if (numValue < min) {
      return 'text-error font-bold'; // Low
    } else if (numValue > max) {
      return 'text-error font-bold'; // High
    } else {
      return 'text-success font-medium'; // Normal
    }
  }

  // Look for pattern like (<6) or (>10)
  const lessMatch = rangeText.match(/\(<\s*([\d.]+)\)/);
  if (lessMatch) {
    const max = parseFloat(lessMatch[1]);
    if (numValue >= max) return 'text-error font-bold';
    return 'text-success font-medium';
  }

  const greaterMatch = rangeText.match(/\(>\s*([\d.]+)\)/);
  if (greaterMatch) {
    const min = parseFloat(greaterMatch[1]);
    if (numValue <= min) return 'text-error font-bold';
    return 'text-success font-medium';
  }

  return ''; // Default if range couldn't be parsed
};

export const ranges = {
  HB: 'g/dl (11-16)',
  PCV: '% (37-54)',
  Platelets: '/mm (100-300)',
  WBCTotal: '/mm (4.0-10.0)',
  Neut: '% (50-70)',
  Lymp: '% (20-70)',
  Mono: '% (0-10)',
  Eosin: '% (1-6)',
  Baso: '% (0-3)',
  ESR: 'mm/h (0-9)',
  RBC: '(3.9-6)',
  Retics: '',
  MCV: 'fl (80-100)',
  ClottingTime: 'mins (2-7)',
  ProthrombinTime: 'secs (10-13)',
  APTT: 'secs (30-40)',
  'PT/INR': '(0.8-1.11)',
  LeCells: '%',
  Microfilaria: '',
  Genotype: '',
  BloodGroup: '',
  RhD: '',
  SicklingTest: '%',
  OccultBlood: '',
  'HIV Screening': '',
  'Hepatitis A': '',
  'Hepatitis B': '',
  'Hepatitis C': '',
  VDRL: '',
  'MANTOUX/HEAF': '',
  AFB: '',
  'TB(Serum)': '',
  'H. PYLORI': '',
  'Pregnancy Test (Urine)': '',
  'Pregnancy Test (Blood)': '',
  'Malaria Parasite': '',
  COMMENTS: '',
  'PT Test': 'secs (10-13)',
  Testosterone: '30-100 ng/dl',
  LH: '2.95-3.65 mIU/ml (f)',
  Prolactin: '4.6-25.0 (f)',
  Progesterone: '1.8-29.2 ng/ml',
  T3: '1.4-3 nmol/L',
  T4: '70-185 nmol/L',
  TSH: '0.3-4.2 mU/L',
  E1: '10-200 Pg/ml',
  E2: '35-310 Pg/ml',
  E3: '<2.0 ng/ml',
  Sodium: '130-150 mEq/L',
  Potassium: '3-5 mEq/L',
  Bicarbonate: '21-30 mEq/L',
  Chloride: '98-111 mEq/L',
  Urea: '1.5-55 mg/dl',
  Creatinine: '0.5-1.5 mg/dl',
  AST: '0.35 U/L',
  ALT: '0.49 U/L',
  'ALK Phos': '64-306 U/L',
  'T. Bilirubin': '0.2-1.2 mg/dl',
  'D. Bilirubin': '0.2-1.2 mg/dl',
  'Total Protein': '6-8 g/dl',
  Albumin: '3.2-5.2 g/dl',
  'Fasting Blood Sugar': '70-100 mg/dl',
  'Random Blood Sugar': '80-180 mg/dl',
  Cholesterol: '<200 mg/dl',
  Triglyceride: '150-199 mg/dl',
  HDL: '30-40 mg/dl',
  LDL: '<150 mg/dl',
  VLDL: '30-40 mg/dl',
  Calcium: '9-11 mg/dl',
  Phosphorus: '2.25 mg/dl',
  'Uric Acid': '2.5 mg/dl',
  'Serum Iron': '60-170 mg/dl',
  PSA: '0-4 ng/ml',
  HBA1C: '<6.5%',
  CA125: '0-35 ku/L',
};
