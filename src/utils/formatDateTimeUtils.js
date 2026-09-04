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

/**
 * Calculate detailed patient age:
 * - <= 1 day: '1 day'
 * - < 30 days: 'X days'
 * - < 1 year: 'X month' or 'X months' (e.g. '6 months')
 * - >= 1 year: 'X year' or 'X years' (e.g. '1 year', '5 years')
 */
export const formatPatientAge = (dob) => {
  if (!dob) return '—';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  if (diffMs < 0) return '1 day';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return '1 day';
  }
  if (diffDays < 30) {
    return `${diffDays} days`;
  }

  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (now.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalMonths = years * 12 + months;

  if (years >= 1) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  const m = Math.max(1, totalMonths);
  return `${m} ${m === 1 ? 'month' : 'months'}`;
};