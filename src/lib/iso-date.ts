/** Postgres `date` columns must be YYYY-MM-DD. node-pg may return a Date object. */
export function normalizeIsoDate(value: unknown, fallback?: string): string {
  const fb = fallback ?? new Date().toISOString().slice(0, 10);

  if (value == null || value === "") return fb;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fb : value.toISOString().slice(0, 10);
  }

  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return fb;
}
