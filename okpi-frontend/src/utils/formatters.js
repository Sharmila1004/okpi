export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatPercentage(value) {
  const numericValue = Number(value ?? 0);
  return `${Math.round(numericValue)}%`;
}

export function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(Number.isNaN(numericValue) ? 0 : numericValue);
}
