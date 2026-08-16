export function formatCurrency(value) {
  const num = Number(value) || 0;
  return `$${num.toFixed(2)}`;
}

export default formatCurrency;
