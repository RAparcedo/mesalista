// Local date as YYYY-MM-DD. (toISOString would shift the day near midnight
// because it converts to UTC; the sv-SE locale formats as YYYY-MM-DD.)
export function todayISO(): string {
  return new Date().toLocaleDateString("sv-SE");
}

// N days before today, as YYYY-MM-DD. daysAgoISO(0) === todayISO().
export function daysAgoISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString("sv-SE");
}
