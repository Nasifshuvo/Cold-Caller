'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { use } from 'react';
import { Client } from '@/types/client';
import { formatBalance } from '@/lib/utils/format';

interface Transaction {
  id: number;
  seconds: number;
  type: 'CREDIT' | 'DEBIT';
  createdAt: string;
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [isVapiModalOpen, setIsVapiModalOpen] = useState(false);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(client?.estimatedMinutesPerCall?.toString() || '0.00');

  const fetchClientDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setClient(data);
    } catch (error) {
      console.error('Failed to fetch client details:', error);
      setError('Failed to fetch client details');
    }
  }, [clientId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
      console.log('No transactions found');
      setTransactions([]);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientDetails();
    fetchTransactions();
  }, [fetchClientDetails, fetchTransactions]);

  useEffect(() => {
    if (client?.estimatedMinutesPerCall) {
      setEstimatedDuration(client.estimatedMinutesPerCall.toString());
    }
  }, [client]);

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          vapiKey: formData.get('vapiKey'),
          vapiAssistantId: formData.get('assistantId'),
        }),
      });

      if (!response.ok) throw new Error('Failed to update client');
      
      await fetchClientDetails();
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update client:', error);
      setError('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const amount = formData.get('amount');

    try {
      const response = await fetch(`/api/clients/${clientId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add balance');
      }

      await Promise.all([
        fetchClientDetails(),
        fetchTransactions(),
      ]);
      
      setIsAddBalanceModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add balance');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset the password?')) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reset password');
      alert('Password has been reset and sent to client email');
    } catch (error) {
      console.error(error);
      setError('Failed to reset password');
    }
  };

  const handleToggleActive = async () => {
    if (!client) return;
    
    try {
      const response = await fetch(`/api/clients/${clientId}/toggle-active`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to toggle active status');
      await fetchClientDetails();
    } catch (error) {
      console.error(error);
      setError('Failed to toggle active status');
    }
  };

  const handleVapiSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/clients/${clientId}/vapi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vapiKey: formData.get('vapiKey'),
          vapiAssistantId: formData.get('assistantId'),
          vapiPhoneNumberId: formData.get('phoneId')
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update VAPI settings');
      }

      await fetchClientDetails();
      setIsVapiModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update VAPI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCost = async () => {
    setLoading(true);
    try {
      const url = `/api/clients/${clientId}/estimated-cost`;
      console.log("URL:", url);
      
      const minutes = parseFloat(estimatedDuration);
      console.log("Sending estimated minutes:", minutes);
      
      const payload = {
        estimatedMinutesPerCall: minutes
      };
      console.log("Payload:", payload);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Response:", data);
      setClient(data);

      if (!response.ok) {
        throw new Error('Failed to update estimated duration');
      }

      // Refresh the page to show updated data
      router.refresh();
      setIsEditingCost(false);
    } catch (error) {
      console.error('Error updating estimated duration:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <div className="space-x-2">
          <Button onClick={() => router.back()}>Back</Button>
          <Button onClick={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? 'Cancel Edit' : 'Edit'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {isEditMode ? (
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              label="Name"
              name="name"
              defaultValue={client.name || ''}
              required
            />
            <Input
              label="Phone"
              name="phone"
              defaultValue={client.phone}
              required
            />
            <Input
              label="VAPI Key"
              name="vapiKey"
              defaultValue={client.vapiKey || ''}
            />
            <Input
              label="Assistant ID"
              name="assistantId"
              defaultValue={client.vapiAssistantId || ''}
            />
            <Input
              label="Phone Number ID"
              name="phoneId"
              defaultValue={client.vapiPhoneNumberId || ''}
            />
            <Button type="submit" isLoading={loading}>Save Changes</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p>{client.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{client.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p>{client.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                <p>{formatBalance(client.balanceInSeconds.toString())}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`px-2 py-1 text-sm rounded-full ${
                  client.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {client.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={() => setIsAddBalanceModalOpen(true)}>
                Add Balance
              </Button>
              <Button onClick={handleResetPassword} variant="secondary">
                Reset Password
              </Button>
              <Button 
                onClick={handleToggleActive}
                variant={client.active ? 'danger' : 'primary'}
              >
                {client.active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">VAPI Configuration</h2>
          <Button onClick={() => setIsVapiModalOpen(true)}>
            {client.vapiKey ? 'Update VAPI' : 'Configure VAPI'}
          </Button>
        </div>
        
        {client.vapiKey ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">VAPI Key</h3>
              <p className="mt-1">•••••••••{client.vapiKey.slice(-4)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assistant ID</h3>
              <p className="mt-1">{client.vapiAssistantId || 'Not set'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone Number ID</h3>
              <p className="mt-1">{client.vapiPhoneNumberId || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">VAPI not configured</p>
        )}
      </div>

      {/* Call Duration Section */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Call Settings</h2>
          <Button onClick={() => setIsEditingCost(!isEditingCost)}>
            {isEditingCost ? 'Cancel' : 'Edit'}
          </Button>
        </div>
        
        {isEditingCost ? (
          <div className="space-y-4">
            <Input
              label="Estimated Call Duration (minutes)"
              name="estimatedDuration"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="3.00"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditingCost(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateCost}
                isLoading={loading}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Estimated Call Duration</h3>
              <p className="mt-1">{formatBalance(Number(client.estimatedMinutesPerCall) * 60)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Balance History</h2>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'CREDIT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatBalance(Number(transaction.seconds))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No transactions found</p>
        )}
      </div>

      {/* Add Balance Modal */}
      {isAddBalanceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Minutes</h2>
            <form onSubmit={handleAddBalance} className="space-y-4">
              <Input
                label="Minutes"
                name="amount"
                type="number"
                min="1"
                required
                placeholder="Enter minutes to add"
              />
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddBalanceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={loading}>
                  Add Minutes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VAPI Configuration Modal */}
      {isVapiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Configure VAPI Settings</h2>
            <form onSubmit={handleVapiSubmit} className="space-y-4">
              <Input
                label="VAPI Key"
                name="vapiKey"
                defaultValue={client.vapiKey || ''}
                required
              />
              <Input
                label="Assistant ID"
                name="assistantId"
                defaultValue={client.vapiAssistantId || ''}
                required
              />
              <Input
                label="Phone Number ID"
                name="phoneId"
                defaultValue={client.vapiPhoneNumberId || ''}
                required
              />
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsVapiModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 