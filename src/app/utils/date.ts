export function normalizeDateInput(value?: string | number | Date | null): Date | null {
  if (value === null || value === undefined || value === "") return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBanglaDateTime(
  value?: string | number | Date | null,
  fallback = "—",
): string {
  const date = normalizeDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatBanglaShortDate(
  value?: string | number | Date | null,
  fallback = "—",
): string {
  const date = normalizeDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
