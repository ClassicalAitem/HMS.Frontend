
export const formatNigeriaDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNigeriaTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-NG', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatNigeriaDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};