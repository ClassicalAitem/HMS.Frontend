
// Nigeria Timezone (WAT - UTC+1) formatting utilities
const NIGERIA_TZ = 'Africa/Lagos';

export const formatNigeriaDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNigeriaDateShort = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatNigeriaTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-NG', {
    timeZone: NIGERIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatNigeriaTime12Hour = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-NG', {
    timeZone: NIGERIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const formatNigeriaDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatNigeriaDateTimeShort = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Get current date/time in Nigeria timezone
export const getNigeriaCurrentDateTime = () => {
  const now = new Date();
  const nigeriaTime = new Date(now.toLocaleString('en-NG', { timeZone: NIGERIA_TZ }));
  return nigeriaTime;
};

export const getNigeriaCurrentDate = () => {
  return formatNigeriaDate(new Date());
};

export const getNigeriaCurrentTime = () => {
  return formatNigeriaTime(new Date());
};

// Get today's date in Nigeria timezone in ISO format (YYYY-MM-DD)
export const getNigeriaTodayISO = () => {
  const nigeriaDate = new Date(new Date().toLocaleString('en-NG', { timeZone: NIGERIA_TZ }));
  const year = nigeriaDate.getFullYear();
  const month = String(nigeriaDate.getMonth() + 1).padStart(2, '0');
  const day = String(nigeriaDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};