export const pad = (n) => String(n).padStart(2, '0');

export function parseDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime()))
    return null;
  return d;
}

export function format_date(date) {
  const d = parseDate(date);
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
         `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function format_only_date(date) {
  const d = parseDate(date);
  if (!d) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function format_only_time(date) {
  const d = parseDate(date);
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function format_date_input(date) {
    const d = parseDate(date)
    if (!d) return '';
    return `${d.getFullYear}-${pad(d.getMonth())}-${pad(d.getDay)}`;
}