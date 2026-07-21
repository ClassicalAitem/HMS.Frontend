export const reportDateRangeOptions = [
  { value: 'all', label: 'All time' },
  { value: '1_month', label: 'Last 1 month' },
  { value: '3_months', label: 'Last 3 months' },
  { value: '6_months', label: 'Last 6 months' },
  { value: 'custom', label: 'Custom range' },
];

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
  const body = rows.map((row) => columns.map((column) => {
    const value = row[column.key];
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""');
  }));

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
