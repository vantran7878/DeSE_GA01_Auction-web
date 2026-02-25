const pad = (n) => String(n).padStart(2, '0');

export function time_remaining(date) {
  const now = new Date();
  const end = new Date(date);
  const diff = end - now;  if (diff <= 0) return '00:00:00';

  const h = pad(Math.floor(diff / 3600000));
  const m = pad(Math.floor((diff % 3600000) / 60000));
  const s = pad(Math.floor((diff % 60000) / 1000));

  return `${h}:${m}:${s}`;
}

export function format_time_remaining(date) {
  const now = new Date();
  const end = new Date(date);
  const diff = end - now;

  if (diff <= 0) return 'Auction Ended';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (days > 3) {
    return `${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())} ` +
           `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
  }

  if (days >= 1) return `${days} days left`;
  if (hours >= 1) return `${hours} hours left`;
  if (minutes >= 1) return `${minutes} minutes left`;

  return `${seconds} seconds left`;
}

export function should_show_relative_time(date) {
  const diff = new Date(date) - new Date();
  if (diff <= 0) return true;
  return Math.floor(diff / 86400000) <= 3;
}