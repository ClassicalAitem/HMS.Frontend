export const reportDateRangeOptions = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '1_month', label: 'Last 1 month' },
  { value: '3_months', label: 'Last 3 months' },
  { value: '6_months', label: 'Last 6 months' },
  { value: 'custom', label: 'Custom range' },
];

export const isDateInPeriod = (dateStr, period, customStart, customEnd) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  if (period === 'today') {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (period === 'month') {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === '1_month') {
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return d >= oneMonthAgo && d <= now;
  }

  if (period === '3_months') {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return d >= threeMonthsAgo && d <= now;
  }

  if (period === '6_months') {
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return d >= sixMonthsAgo && d <= now;
  }

  if (period === 'custom') {
    if (!customStart && !customEnd) return true;
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date(8640000000000000);
    return d >= start && d <= end;
  }

  return true; // 'all'
};

const normalizeDateValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return trimmed.slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

export const getDateRangeFromSelection = (selection, customStartDate, customEndDate) => {
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const startFrom = (months) => {
    const date = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
    return date.toISOString().slice(0, 10);
  };

  switch (selection) {
    case '1_month':
      return { startDate: startFrom(1), endDate: endDate.toISOString().slice(0, 10) };
    case '3_months':
      return { startDate: startFrom(3), endDate: endDate.toISOString().slice(0, 10) };
    case '6_months':
      return { startDate: startFrom(6), endDate: endDate.toISOString().slice(0, 10) };
    case 'custom':
      return { startDate: customStartDate || '', endDate: customEndDate || '' };
    default:
      return { startDate: '', endDate: '' };
  }
};

export const isWithinDateRange = (value, range) => {
  const normalizedValue = normalizeDateValue(value);
  if (!normalizedValue) return true;

  if (!range?.startDate && !range?.endDate) return true;

  const baseValue = normalizedValue;
  const startDate = normalizeDateValue(range?.startDate);
  const endDate = normalizeDateValue(range?.endDate);

  if (startDate && baseValue < startDate) return false;
  if (endDate && baseValue > endDate) return false;

  return true;
};

export const exportRowsToCsv = (rows, columns, fileName) => {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) =>
    columns.map((column) => {
      const value = row[column.key];
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value === null || value === undefined) return '';
      return String(value).replace(/"/g, '""');
    })
  );

  const csv = [header, ...body]
    .map((row) => row.map((value) => `"${value}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
