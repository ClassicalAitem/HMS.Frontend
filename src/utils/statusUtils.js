/**
 * Status Utility Functions
 * 
 * The patient status field has transitioned from an array to a single status string.
 * These helpers keep backwards compatibility with older array-based status values.
 */

/**
 * Normalize status to a single string.
 * If an array is provided, we take the last non-empty status (assumed to be the "current" status).
 * @param {string|string[]|null|undefined} status - The status value(s)
 * @returns {string} - Normalized status string
 */
export const normalizeStatus = (status) => {
  if (Array.isArray(status)) {
    const list = status
      .map((s) => normalizeStatus(s))
      .filter((s) => typeof s === 'string' && s.trim());
    return list.length ? list[list.length - 1] : '';
  }

  if (status && typeof status === 'object') {
    if (typeof status.status === 'string' && status.status.trim()) {
      return status.status;
    }
    return normalizeStatus(status.status);
  }

  if (typeof status === 'string') {
    return status;
  }

  return '';
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
 * Get badge objects for a status or list of statuses
 * @param {string|string[]} status - The status value(s)
 * @returns {Array} - Array of {value, text, class} objects for display
 */
export const getStatusBadges = (status) => {
  const normalized = Array.isArray(status) ? status : [status];
  return normalized
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => ({
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
export const getPrimaryStatus = (status) => normalizeStatus(status);

/**
 * Check if a patient has a specific status
 * @param {string|string[]} patientStatus - The patient's status
 * @param {string} statusToCheck - The status to check for
 * @returns {boolean} - Whether the patient has that status
 */
export const hasStatus = (patientStatus, statusToCheck) => {
  const normalized = Array.isArray(patientStatus) ? patientStatus : [patientStatus];
  return normalized.includes(statusToCheck);
};

/**
 * Check if a patient has any of the given statuses
 * @param {string|string[]} patientStatus - The patient's status
 * @param {string[]} statusesToCheck - Array of statuses to check
 * @returns {boolean} - Whether the patient has any of those statuses
 */
export const hasAnyStatus = (patientStatus, statusesToCheck) => {
  const normalized = Array.isArray(patientStatus) ? patientStatus : [patientStatus];
  return statusesToCheck.some((s) => normalized.includes(s));
};

/**
 * Format status for search/filter purposes
 * @param {string|string[]} status - The status value(s)
 * @returns {string} - Comma-separated display string
 */
export const formatStatusForDisplay = (status) => {
  const badges = getStatusBadges(status);
  return badges.map((b) => b.text).join(', ') || '—';
};

/**
 * Merge patient status when transitioning roles.
 * With the new single-status model, this helper simply returns the new status.
 * It remains backwards compatible with array inputs.
 *
 * @param {string|string[]} currentStatus - Patient's current status
 * @param {string} completingRole - Role completing (unused for single status mode)
 * @param {string|string[]} newStatus - New status to apply
 * @returns {string} - The resulting status string
 */
export const mergePatientStatus = (currentStatus, completingRole, newStatus) => {
  const normalizedNew = normalizeStatus(newStatus);
  return normalizedNew;
};
