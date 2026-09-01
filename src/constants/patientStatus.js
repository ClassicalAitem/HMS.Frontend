// Centralized patient status constants matching backend enum values
// keep property names uppercase for easier reference, values are the strings
// the API expects lowercase underscore values so we mirror that.

export const PATIENT_STATUS = {
  REGISTERED: "registered",
  AWAITING_FRONT_DESK: "awaiting_front_desk",
  AWAITING_PAYMENT: "awaiting_payment",
  AWAITING_VITALS: "awaiting_vitals",
  VITALS_COMPLETED: "vitals_completed",
  AWAITING_CONSULTATION: "awaiting_consultation",
  AWAITING_DOCTOR: "awaiting_doctor",
  AWAITING_MD: "awaiting_md",
  IN_CONSULTATION: "in_consultation",
  CONSULTATION_COMPLETED: "consultation_completed",
  AWAITING_SAMPLING: "awaiting_sampling",
  SAMPLING_COMPLETED: "sampling_completed",
  AWAITING_REVIEW: "awaiting_review",
  REVIEW_COMPLETED: "review_completed",
  AWAITING_INJECTION: "awaiting_injection",
  INJECTION_COMPLETED: "injection_completed",
  AWAITING_CASHIER: "awaiting_cashier",
  AWAITING_HMO: "awaiting_hmo",
  HMO_APPROVED: "hmo_approved",
  HMO_REJECTED: "hmo_rejected",
  PAYMENT_COMPLETED: "payment_completed",
  AWAITING_NURSE: "awaiting_nurse",
  AWAITING_LAB: "awaiting_lab",
  LAB_IN_PROGRESS: "lab_in_progress",
  LAB_COMPLETED: "lab_completed",
  AWAITING_SONOGRAPHER: "awaiting_sonographer",
  SONOGRAPHY: "sonography_completed",
  AWAITING_RADIOLOGY: "awaiting_radiology",
  RADIOLOGY_IN_PROGRESS: "radiology_in_progress",
  RADIOLOGY_COMPLETED: "radiology_completed",
  AWAITING_PHARMACY: "awaiting_pharmacy",
  PHARMACY_COMPLETED: "pharmacy_completed",
  AWAITING_ADMISSION: "awaiting_admission",
  ADMITTED: "admitted",
  UNDER_OBSERVATION: "under_observation",
  AWAITING_SURGERY: "awaiting_surgery",
  SURGERY_IN_PROGRESS: "surgery_in_progress",
  POST_SURGERY_RECOVERY: "post_surgery_recovery",
  POST_SURGERY_OBSERVATION: "post_surgery_observation",
  SURGERY_COMPLETED: "surgery_completed",
  TRANSFERRED: "transferred",
  REFERRED: "referred",
  ISOLATED: "isolated",
  AWAITING_DISCHARGE_APPROVAL: "awaiting_discharge_approval",
  DISCHARGE_IN_PROGRESS: "discharge_in_progress",
  DISCHARGED: "discharged",
  AWAITING_FOLLOW_UP: "awaiting_follow_up",
  FOLLOW_UP_COMPLETED: "follow_up_completed",
  DECEASED: "deceased",
  NO_SHOW: "no_show",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
}



export const PATIENT_ADMISSION_STATUS = {
  PENDING_ADMISSION: 'pending_admission',
  ADMITTED: 'admitted',
  DISCHARGED: 'discharged',
}

export const FREQUENCY  ={
  STAT  : "STAT",
  DLY  : "dly",
  BD  : "b.d",
  TDS  : "tds",
  QDS  : "qds",
  HLY  : "hly",
  FOUR_HLY  : "4hly",
  SIX_HLY  : "6hly",
  EIGHT_HLY  : "8hly",
  TWELVE_HLY : "12hly",
  TWENTYFOUR_HLY : "24hly",
  MANE : "mane",
  NOCTE : "nocte",
  PRN : "prn",
  ALT_DIE : "alt die",
}

export const ORAL_FREQUENCIES = [
  FREQUENCY.STAT,
  FREQUENCY.DLY,
  FREQUENCY.BD,
  FREQUENCY.TDS,
  FREQUENCY.QDS,
  FREQUENCY.MANE,
  FREQUENCY.NOCTE,
  FREQUENCY.PRN,
  FREQUENCY.ALT_DIE,
];

export const INJECTION_FREQUENCIES = [
  FREQUENCY.STAT,
  FREQUENCY.DLY,
  FREQUENCY.HLY,
  FREQUENCY.FOUR_HLY,
  FREQUENCY.SIX_HLY,
  FREQUENCY.EIGHT_HLY,
  FREQUENCY.TWELVE_HLY,
  FREQUENCY.TWENTYFOUR_HLY,
  FREQUENCY.MANE,
  FREQUENCY.NOCTE,
  FREQUENCY.PRN,
];

export const DURATION = {
  ONE_SEVEN : "1/7",
  TWO_SEVEN : "2/7",
  THREE_SEVEN : "3/7",
  FOUR_SEVEN : "4/7",
  FIVE_SEVEN : "5/7",
  SIX_SEVEN : "6/7",
  ONE_FIFTYTWO : "1/52",
  TWO_FIFTYTWO : "2/52",
  THREE_FIFTYTWO : "3/52",
  ONE_TWELVE : "1/12",
  TWO_TWELVE : "2/12",
  THREE_TWELVE : "3/12",
  FOUR_TWELVE : "4/12",
  FIVE_TWELVE : "5/12",
  SIX_TWELVE : "6/12",
  ONE_YEAR : "1yr",
}

export function isValidDuration(value) {
  if (!value) return false;
  const str = String(value).trim();
  if (/^\d+yr$/.test(str)) return true;
  if (/^\d+\/(7|52|12)$/.test(str)) return true;
  return Object.values(DURATION).includes(str);
}


