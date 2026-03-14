/**
 * Generic CSV generation utility.
 *
 * Usage:
 *   const csv = generateCSV(data, [
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' },
 *   ]);
 *   downloadCSV(csv, 'export.csv');
 */

export interface CSVColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function generateCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  const header = columns.map((col) => escapeCSV(col.label)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = getNestedValue(row, col.key as string);
        const value = col.format ? col.format(raw, row) : String(raw ?? '');
        return escapeCSV(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
