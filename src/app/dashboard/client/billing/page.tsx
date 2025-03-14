'use client';
import { useEffect, useState } from "react";
import { formatBalance } from '@/lib/utils/format';

interface Transaction {
  id: number;
  seconds: number;
  type: 'CREDIT' | 'DEBIT';
  createdAt: string;
  reason?: string;
  reference?: string;
  phoneNumber?: string;
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/clients/transactions');
        if (!response.ok) throw new Error('Failed to fetch transactions');
        
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'CREDIT' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBalance(Number(transaction.seconds))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.reason || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.reference || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.phoneNumber || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {transactions.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No transactions found
          </p>
        )}
      </div>
    </div>
  );
} 