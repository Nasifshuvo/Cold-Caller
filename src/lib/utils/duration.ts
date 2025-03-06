/**
 * Convert seconds to minutes, rounding up to the nearest minute
 * @param seconds Duration in seconds
 * @returns Minutes (rounded up)
 */
export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}

/**
 * Calculate call duration in seconds between two dates
 * @param startDate Call start date
 * @param endDate Call end date
 * @returns Duration in seconds
 */
export function calculateDurationInSeconds(startDate: Date, endDate: Date): number {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / 1000);
}

/**
 * Format duration for display
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "1m 30s" or "2m")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
} 