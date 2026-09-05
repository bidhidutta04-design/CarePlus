// Integer paise arithmetic — avoids IEEE-754 float drift in money totals.
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function billTotals(
  items: { amount: number }[],
  discount: number,
): {
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
} {
  const subtotalP = items.reduce((s, i) => s + toPaise(i.amount), 0);
  const discountP = Math.min(toPaise(discount), subtotalP);
  const taxableP = subtotalP - discountP;
  const taxP = Math.round(taxableP * 0.05);
  const totalP = taxableP + taxP;
  return {
    subtotal: toRupees(subtotalP),
    discount: toRupees(discountP),
    tax: toRupees(taxP),
    totalAmount: toRupees(totalP),
  };
}
