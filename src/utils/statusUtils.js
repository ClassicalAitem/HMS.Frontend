/**
 * Status Utility Functions
 * Handles conversion and display of patient status which is now an array
 */

/**
 * Normalize status to ensure it's always an array
 * @param {string|string[]|null|undefined} status - The status to normalize
 * @returns {string[]} - Array of statuses
 */
export const normalizeStatus = (status) => {
  if (Array.isArray(status)) {
    return status.filter(s => s && typeof s === 'string');
  }
  if (typeof status === 'string' && status.trim()) {
    return [status];
  }
  return [];
};

/**
 * Get display text for a single status
 * @param {string} status - The status value
 * @returns {string} - Human-readable status text
 */
export const getStatusDisplayText = (status) => {
  if (!status) return '';
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get badge color class for a status
 * @param {string} status - The status value
 * @returns {string} - Tailwind badge class
 */
export const getStatusBadgeClass = (status) => {
  if (!status) return 'badge badge-ghost';

  const s = status.toLowerCase();
  
  // Active/Positive statuses
  if (s.includes('completed') || s.includes('admitted') || s.includes('lab_completed') || s.includes('pharmacy_completed') || s.includes('radiology_completed')) {
    return 'badge badge-success';
  }
  
  // Waiting/Pending statuses
  if (s.includes('awaiting') || s.includes('pending') || s.includes('under_observation')) {
    return 'badge badge-warning';
  }
  
  // Negative/Exit statuses
  if (s.includes('discharged') || s.includes('deceased') || s.includes('cancelled') || s.includes('no_show')) {
    return 'badge badge-error';
  }
  
  // In-process statuses
  if (s.includes('in_') || s.includes('consultation') || s.includes('registered') || s.includes('referred') || s.includes('transferred') || s.includes('isolated')) {
    return 'badge badge-info';
  }
  
  return 'badge badge-ghost';
};

/**
 * Get all badge classes for status array
 * @param {string|string[]} status - The status value(s)
 * @returns {Array} - Array of {text, class} objects for display
 */
export const getStatusBadges = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.map(s => ({
    value: s,
    text: getStatusDisplayText(s),
    class: getStatusBadgeClass(s)
  }));
};

/**
 * Get the latest/primary status for display
 * @param {string|string[]} status - The status value(s)
 * @returns {string} - The primary status string
 */
export const getPrimaryStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.length > 0 ? normalized[normalized.length - 1] : '';
};

/**
 * Check if a patient has a specific status
 * @param {string|string[]} patientStatus - The patient's status
 * @param {string} statusToCheck - The status to check for
 * @returns {boolean} - Whether the patient has that status
 */
export const hasStatus = (patientStatus, statusToCheck) => {
  const normalized = normalizeStatus(patientStatus);
  return normalized.includes(statusToCheck);
};

/**
 * Check if a patient has any of the given statuses
 * @param {string|string[]} patientStatus - The patient's status
 * @param {string[]} statusesToCheck - Array of statuses to check
 * @returns {boolean} - Whether the patient has any of those statuses
 */
export const hasAnyStatus = (patientStatus, statusesToCheck) => {
  const normalized = normalizeStatus(patientStatus);
  return statusesToCheck.some(s => normalized.includes(s));
};

/**
 * Format status for search/filter purposes
 * @param {string|string[]} status - The status value(s)
 * @returns {string} - Comma-separated display string
 */
export const formatStatusForDisplay = (status) => {
  const badges = getStatusBadges(status);
  return badges.map(b => b.text).join(', ') || '—';
};

/**
 * Merge patient status intelligently when transitioning between departments
 * Removes the completing role's status and adds the new status
 * @param {string|string[]} currentStatus - Patient's current status
 * @param {string} completingRole - Role completing (e.g., 'nurse', 'doctor', 'pharmacist')
 * @param {string|string[]} newStatus - New status to add
 * @returns {string[]} - Merged status array
 * 
 * Example: 
 * mergePatientStatus(['awaiting_nurse', 'awaiting_lab'], 'nurse', 'awaiting_doctor')
 * returns ['awaiting_lab', 'awaiting_doctor']
 */
export const mergePatientStatus = (currentStatus, completingRole, newStatus) => {
  const normalized = normalizeStatus(currentStatus);
  const newStatusArr = normalizeStatus(newStatus);
  
  // Map role to status patterns to remove when that role completes
  const roleCompletionPatterns = {
    'nurse': ['awaiting_vitals', 'vitals_completed', 'awaiting_sampling', 'sampling_completed', 'awaiting_injection', 'injection_completed', 'awaiting_vaccination', 'awaiting_nurse'],
    'doctor': ['awaiting_doctor', 'awaiting_consultation', 'in_consultation', 'consultation_completed', 'awaiting_surgery', 'surgery_in_progress', 'post_surgery_recovery', 'post_surgery_observation', 'surgery_completed'],
    'lab': ['awaiting_lab', 'lab_in_progress', 'lab_completed'],
    'radiology': ['awaiting_radiology', 'radiology_in_progress', 'radiology_completed'],
    'pharmacy': ['awaiting_pharmacy', 'pharmacy_completed'],
    'cashier': ['awaiting_cashier', 'awaiting_payment', 'payment_completed'],
    'frontdesk': ['awaiting_front_desk', 'registered'],
    'review': ['awaiting_review', 'review_completed'],
    'discharge': ['awaiting_discharge_approval', 'discharge_in_progress'],
  };
  
  // Remove the completing role's statuses
  let merged = normalized.filter(s => !roleCompletionPatterns[completingRole]?.includes(s));
  
  // Add new statuses (avoiding duplicates)
  newStatusArr.forEach(newS => {
    if (!merged.includes(newS)) {
      merged.push(newS);
    }
  });
  
  // If nothing left, just return the new status
  return merged.length > 0 ? merged : newStatusArr;
};
