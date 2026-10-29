export const adminDateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7_days", label: "Last 7 Days" },
  { value: "1_month", label: "Last 1 Month" },
  { value: "3_months", label: "Last 3 Months" },
  { value: "6_months", label: "Last 6 Months" },
  { value: "custom", label: "Custom Date Range" },
];

const normalizeDateValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
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

  const startFromDays = (days) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
    return date.toISOString().slice(0, 10);
  };

  const startFromMonths = (months) => {
    const date = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
    return date.toISOString().slice(0, 10);
  };

  switch (selection) {
    case "today":
      return {
        startDate: endDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      };
    case "7_days":
      return {
        startDate: startFromDays(7),
        endDate: endDate.toISOString().slice(0, 10),
      };
    case "1_month":
      return {
        startDate: startFromMonths(1),
        endDate: endDate.toISOString().slice(0, 10),
      };
    case "3_months":
      return {
        startDate: startFromMonths(3),
        endDate: endDate.toISOString().slice(0, 10),
      };
    case "6_months":
      return {
        startDate: startFromMonths(6),
        endDate: endDate.toISOString().slice(0, 10),
      };
    case "custom":
      return {
        startDate: customStartDate || "",
        endDate: customEndDate || "",
      };
    default:
      return { startDate: "", endDate: "" };
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

export const exportRowsToCsv = (rows, columns, fileName = "hospital-report.csv") => {
  const header = columns.map((col) => col.label);
  const body = rows.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (value === null || value === undefined) return "";
      return String(value).replace(/"/g, '""');
    })
  );

  const csv = [header, ...body]
    .map((row) => row.map((val) => `"${val}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

