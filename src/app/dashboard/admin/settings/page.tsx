'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SettingValue {
  multiplier: number;
}

type Setting = {
  id: number;
  key: string;
  value: SettingValue;
  category: string;
  label: string;
  description?: string;
  isSystem: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const callRateMultiplier = formData.get('callRateMultiplier');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'call_rate_multiplier',
          value: { multiplier: parseFloat(callRateMultiplier as string) / 100 },
          category: 'billing',
          label: 'Call Rate Multiplier',
          description: 'Percentage multiplier applied to base call rates'
        })
      });

      if (!response.ok) throw new Error('Failed to update settings');
      await fetchSettings();
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const callRateMultiplier = settings.find(s => s.key === 'call_rate_multiplier')?.value?.multiplier ?? 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">System Settings</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Billing Settings</h3>
            <div className="space-y-4">
              <Input
                label="Call Rate Multiplier (%)"
                name="callRateMultiplier"
                type="number"
                step="0.01"
                min="1"
                defaultValue={(callRateMultiplier * 100).toFixed(2)}
                helperText="This percentage will be applied to the base call rate"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 