export function formatDateTime(date: string | Date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

export function formatDuration(seconds: number) {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ');
} 