import admissionApi from "@/services/api/admissionApi";

// Centralized card type constants matching backend enum values
export const CARD_TYPE = {
  PERSONAL: "personal",
  FAMILY: "family",
  COMPANY: "company",
  EMERGENCY: "emergency",
  ANTENATAL: "antenatal",
};

export const CARD_TYPE_LABELS = {
  personal: 'Personal',
  family: 'Family',
  company: 'Company',
  emergency: 'Emergency',
  antenatal: 'Antenatal',
};

export const CARD_TYPE_STYLES = {
  personal: 'badge badge-info',
  family: 'badge badge-primary',
  company: 'badge badge-success',
  emergency: 'badge badge-error',
  antenatal: 'badge badge-warning',
};
export const SERVICE_CHARGE_CATEGORY = {
  LABORATORY:  "laboratory",
  ADMISSION : "admission",
  GENERAL : "general",
  PHARMACY : "pharmacy",
  RADIOLOGY : "radiology",
  CONSULTATION : "consultation",
  THERAPY : "therapy",
  SURGICAL : "surgical",
  EMERGENCY : "emergency",
  
}

export const SERVICE_CHARGE_CATEGORY_LABELS = {
  laboratory: "laboratory",
  admission: "admission",
  general: "general",
  pharmacy: "pharmacy",
  radiology: "radiology",
  consultation: "consultation",
  therapy: "therapy",
  surgical: "surgical",
  emergency: "emergency"
}


