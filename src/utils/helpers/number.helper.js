export function format_number(price) {
  return new Intl.NumberFormat('en-US').format(price);
}