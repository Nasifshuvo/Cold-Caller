interface SettingValue {
  multiplier: number;
}

interface Setting {
  id: number;
  key: string;
  value: SettingValue;
  category: string;
  label: string;
  description?: string;
  isSystem: boolean;
}

export async function getCallRateMultiplier(): Promise<number> {
  try {
    const response = await fetch('/api/admin/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    const data = await response.json();
    // Make sure data is an array
    const settings: Setting[] = Array.isArray(data) ? data : [data];
    
    const multiplier = settings.find((s: Setting) => s.key === 'call_rate_multiplier')?.value?.multiplier ?? 1;
    return multiplier;
  } catch (error) {
    console.error('Error fetching rate multiplier:', error);
    return 1; // Default multiplier if there's an error
  }
} 