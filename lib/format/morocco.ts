export function formatMAD(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} MAD`;
}

export function formatNumberFR(value: number): string {
  return new Intl.NumberFormat('fr-MA').format(value);
}

export function formatCasablancaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatCasablancaTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-MA', {
    timeZone: 'Africa/Casablanca',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
