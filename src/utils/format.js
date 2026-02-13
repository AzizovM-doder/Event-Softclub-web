export function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toTimeInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

export function fromDateTimeInputs(dateStr, timeStr) {
  // Keep it simple: store ISO strings
  const dateIso = dateStr ? new Date(`${dateStr}T00:00:00.000Z`).toISOString() : new Date().toISOString();
  const timeIso = timeStr ? new Date(`1970-01-01T${timeStr}:00.000Z`).toISOString() : new Date().toISOString();
  return { dateIso, timeIso };
}

export function truncate(str, n = 70) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}
