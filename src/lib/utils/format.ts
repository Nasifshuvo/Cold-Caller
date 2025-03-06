/**
 * Formats seconds into a human-readable string (e.g., "1 min 39 sec")
 * @param seconds - The number of seconds to format
 * @returns Formatted string
 */
export function formatBalance(seconds: number | string | null | undefined): string {
  if (!seconds) return '0 sec';
  
  const totalSeconds = typeof seconds === 'string' ? Number(seconds) : seconds;
  if (isNaN(totalSeconds)) return '0 sec';

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }
  
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
} 