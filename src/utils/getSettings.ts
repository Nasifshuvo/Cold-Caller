interface Setting {
  key: string;
  value: {
    multiplier: number;
  };
}

export async function getCallRateMultiplier() {
  try {
    const response = await fetch('/api/admin/settings');
    const settings: Setting[] = await response.json();
    const multiplier = settings.find((s: Setting) => s.key === 'call_rate_multiplier')?.value?.multiplier ?? 1;
    return multiplier;
  } catch (error) {
    console.error('Error fetching rate multiplier:', error);
    return 1; // Default to 100% if error
  }
} 