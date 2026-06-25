const NIGERIA_TZ = 'Africa/Lagos';

const toUTC = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && !date.endsWith('Z') && !date.includes('+')) {
    return date.replace(' ', 'T') + 'Z';
  }
  return date;
};

export const formatNigeriaDate = (date) => {
  if (!date) return '—';
  return new Date(toUTC(date)).toLocaleDateString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNigeriaTime = (date) => {
  if (!date) return '—';
  return new Date(toUTC(date)).toLocaleTimeString('en-NG', {
    timeZone: NIGERIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatNigeriaTime12Hour = (date) => {
  if (!date) return '—';
  return new Date(toUTC(date)).toLocaleTimeString('en-NG', {
    timeZone: NIGERIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const formatNigeriaDateTime = (date) => {
  if (!date) return '—';
  return new Date(toUTC(date)).toLocaleString('en-NG', {
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
  return new Date(toUTC(date)).toLocaleString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatNigeriaDateShort = (date) => {
  if (!date) return '—';
  return new Date(toUTC(date)).toLocaleDateString('en-NG', {
    timeZone: NIGERIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getNigeriaCurrentDateTime = () => {
  return new Date();
};

export const getNigeriaCurrentDate = () => formatNigeriaDate(new Date());
export const getNigeriaCurrentTime = () => formatNigeriaTime(new Date());

export const getNigeriaTodayISO = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: NIGERIA_TZ }).format(now);
};