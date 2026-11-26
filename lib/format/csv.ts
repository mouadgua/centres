export function sanitizeCsvCell(raw: string | number | boolean | undefined | null): string {
  const value = String(raw ?? '');
  const trimmed = value.trimStart();
  const safe =
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@')
      ? `'${value}`
      : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadSafeCsv(
  fileName: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | undefined | null>>,
  separator: ';' | ',' = ';'
) {
  const csv = [headers, ...rows]
    .map((line) => line.map(sanitizeCsvCell).join(separator))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
