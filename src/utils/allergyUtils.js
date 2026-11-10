/**
 * Clinical Drug Allergy & Sensitivity Utilities
 */

export const COMMON_ALLERGY_TAGS = [
  'Penicillin',
  'Amoxicillin',
  'Sulfa / Septrin',
  'Aspirin / NSAIDs',
  'Ibuprofen',
  'Ceftriaxone / Cephalosporins',
  'Ciprofloxacin / Quinolones',
  'Codeine / Opioids',
  'No Known Drug Allergies (NKDA)',
];

const ALLERGY_MAP = {
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'amoxil', 'cloxacillin', 'flucloxacillin', 'piperacillin'],
  amoxicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'amoxil'],
  sulfa: ['sulfa', 'septrin', 'co-trimoxazole', 'bactrim', 'sulfamethoxazole', 'sulfadoxine', 'fansidar'],
  septrin: ['sulfa', 'septrin', 'co-trimoxazole', 'bactrim', 'sulfamethoxazole'],
  nsaid: ['nsaid', 'aspirin', 'ibuprofen', 'diclofenac', 'cataflam', 'voltaren', 'piroxicam', 'feldene', 'ketoprofen', 'naproxen', 'meloxicam'],
  aspirin: ['aspirin', 'nsaid', 'ibuprofen', 'diclofenac'],
  ibuprofen: ['ibuprofen', 'nsaid', 'aspirin', 'diclofenac'],
  cephalosporin: ['cephalosporin', 'ceftriaxone', 'rocephin', 'cefuroxime', 'zinnat', 'cefixime', 'cephalexin'],
  ceftriaxone: ['ceftriaxone', 'rocephin', 'cephalosporin', 'cefuroxime'],
  ciprofloxacin: ['ciprofloxacin', 'cipro', 'quinolone', 'fluoroquinolone', 'levofloxacin', 'ofloxacin'],
  codeine: ['codeine', 'opioid', 'tramadol', 'morphine', 'fentanyl', 'pethidine'],
};

export const parseAllergies = (allergies) => {
  if (!allergies) return [];
  if (Array.isArray(allergies)) return allergies.filter(Boolean);
  if (typeof allergies === 'string') {
    return allergies.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Checks whether a prescribed or selected drug triggers any recorded patient allergy or known cross-sensitivity.
 */
export const checkDrugAllergyConflict = (drugName = '', patientAllergies = []) => {
  const allergyList = parseAllergies(patientAllergies);
  if (!drugName || allergyList.length === 0) return null;

  const normDrug = drugName.toLowerCase().trim();

  // If patient is recorded as having No Known Drug Allergies
  const hasNKDA = allergyList.some(
    (a) => a.toLowerCase().includes('nkda') || a.toLowerCase().includes('no known')
  );
  if (hasNKDA) return null;

  for (const allergy of allergyList) {
    const normAllergy = allergy.toLowerCase().trim();
    if (!normAllergy || normAllergy.includes('none')) continue;

    // 1. Direct substring match
    if (normDrug.includes(normAllergy) || normAllergy.includes(normDrug)) {
      return {
        hasConflict: true,
        allergy,
        drugName,
        reason: `Prescribed drug "${drugName}" matches recorded allergy "${allergy}".`,
      };
    }

    // 2. Cross-sensitivity check
    for (const [key, relatedList] of Object.entries(ALLERGY_MAP)) {
      if (normAllergy.includes(key)) {
        const drugMatches = relatedList.some((rel) => normDrug.includes(rel));
        if (drugMatches) {
          return {
            hasConflict: true,
            allergy,
            drugName,
            reason: `Cross-sensitivity alert: "${drugName}" belongs to or cross-reacts with "${allergy}".`,
          };
        }
      }
    }
  }

  return null;
};

