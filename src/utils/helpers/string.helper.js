export function truncate(str, len) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

export function mask_name(fullname) {
  if (!fullname) return null;
  const name = fullname.trim();
  if (name.length === 0) return null;
  if (name.length === 1) return '*';
  if (name.length === 2) return name[0] + '*';

  let masked = '';
  for (let i = 0; i < name.length; i++) {
    masked += i % 2 === 0 ? name[i] : '*';
  }
  return masked;
}

export function replace(str, search, replaceWith) {
  if (!str) return '';
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.replace(new RegExp(escaped, 'g'), replaceWith);
}