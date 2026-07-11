// "8.5" (Prisma Decimal over JSON) → "8,50 €", Spanish style.
const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(price: string): string {
  return euros.format(Number(price));
}
