export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return '–';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function decodeSafName(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const segments = decoded.split('/');
    return segments[segments.length - 1] ?? decoded;
  } catch {
    return uri;
  }
}
