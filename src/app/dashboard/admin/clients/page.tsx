'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  vapiKey?: string;
  vapiAssistantId?: string;
  vapiPhoneNumberId?: string;
  active: boolean;
  createdAt: string;
  user: {
    email: string;
    active: boolean;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVapiModalOpen, setIsVapiModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch clients');
      }
      
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          password: formData.get('password'),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add client');
      }

      await fetchClients(); // Refresh the clients list
      setIsModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleConfigureVAPI = async () => {
    // ... function implementation
  };

  const handleVapiSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/clients/${selectedClientId}/vapi`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vapiKey: formData.get('vapiKey'),
          vapiAssistantId: formData.get('assistantId'),
          vapiPhoneNumberId: formData.get('phoneId')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update VAPI settings');
      }

      await fetchClients();
      setIsVapiModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Client
        </Button>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAPI Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.user.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${Number(client.balance).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.vapiKey ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {client.vapiKey ? 'Configured' : 'Not Configured'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/admin/clients/${client.id}`)}
                  >
                    Details
                  </Button>
                  {/* <Button
                    variant="secondary"
                    onClick={() => handleConfigureVAPI(client.id)}
                  >
                    Configure VAPI
                  </Button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 my-6 max-h-[90vh] flex flex-col">
            <div className="p-6 flex-shrink-0">
              <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
            <div className="p-6 pt-0 overflow-y-auto flex-grow" style={{ height: 'calc(90vh - 200px)', overflow: 'scroll' }}>
              {error && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded" >
                  {error}
                </div>
              )}
              
                <Input
                  label="Name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter client name"
                />
                
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="Enter phone number"
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter client email"
                />
                
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter password"
                />

                <Input
                  label="Initial Balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">VAPI Settings (Optional)</h3>
                  <Input
                    label="VAPI Key"
                    name="vapiKey"
                    type="text"
                    placeholder="Enter VAPI key"
                  />
                  <Input
                    label="Assistant ID"
                    name="assistantId"
                    type="text"
                    placeholder="Enter Assistant ID"
                  />
                  <Input
                    label="Phone Number ID"
                    name="phoneId"
                    type="text"
                    placeholder="Enter Phone Number ID"
                  />
                </div>
              
            </div>

            <div className="p-6 border-t flex justify-end space-x-3 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}

              >
                Add Client
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
                type="text"
                required
                placeholder="Enter VAPI key"
              />
              <Input
                label="Assistant ID"
                name="assistantId"
                type="text"
                required
                placeholder="Enter Assistant ID"
              />
              <Input
                label="Phone Number ID"
                name="phoneId"
                type="text"
                required
                placeholder="Enter Phone Number ID"
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