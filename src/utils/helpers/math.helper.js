export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;

export function round(value, decimals = 0) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}