// Local date as YYYY-MM-DD. (toISOString would shift the day near midnight
// because it converts to UTC; the sv-SE locale formats as YYYY-MM-DD.)
export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE");
}
