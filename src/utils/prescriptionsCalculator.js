import { DURATION, FREQUENCY } from "@/constants/patientStatus";

const TIMES_PER_DAY = {
  [FREQUENCY.DLY]: 1,
  [FREQUENCY.BD]: 2,
  [FREQUENCY.TDS]: 3,
  [FREQUENCY.QDS]: 4,
  [FREQUENCY.HLY]: 24,
  [FREQUENCY.FOUR_HLY]: 6,   // 24 / 4
  [FREQUENCY.SIX_HLY]: 4,    // 24 / 6
  [FREQUENCY.EIGHT_HLY]: 3,  // 24 / 8
  [FREQUENCY.TWELVE_HLY]: 2, // 24 / 12
  [FREQUENCY.TWENTYFOUR_HLY]: 1,
};

const DAYS = {
  [DURATION.ONE_SEVEN]: 1,
  [DURATION.TWO_SEVEN]: 2,
  [DURATION.THREE_SEVEN]: 3,
  [DURATION.FOUR_SEVEN]: 4,
  [DURATION.FIVE_SEVEN]: 5,
  [DURATION.SIX_SEVEN]: 6,
  [DURATION.ONE_FIFTYTWO]: 7,
  [DURATION.TWO_FIFTYTWO]: 14,
  [DURATION.THREE_FIFTYTWO]: 21,
  [DURATION.ONE_TWELVE]: 30,
  [DURATION.TWO_TWELVE]: 60,
  [DURATION.THREE_TWELVE]: 90,
  [DURATION.FOUR_TWELVE]: 120,
  [DURATION.FIVE_TWELVE]: 150,
  [DURATION.SIX_TWELVE]: 180,
  [DURATION.ONE_YEAR]: 365,
};

/**
 * Returns the total number of units to dispense for a medication.
 * STAT always resolves to 1, regardless of duration.
 */
export function calculateDispenseQuantity(frequency, duration) {
  if (frequency === FREQUENCY.STAT) return 1;

  const timesPerDay = TIMES_PER_DAY[frequency];
  const days = DAYS[duration];

  if (!timesPerDay || !days) return 0; // unrecognized combo — surface as 0 so it's caught, don't silently guess

  return timesPerDay * days;
}

export function calculateDispenseCost(frequency, duration, unitPrice) {
  return calculateDispenseQuantity(frequency, duration) * (unitPrice || 0);
}