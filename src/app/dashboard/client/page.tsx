'use client';
import { useState, useEffect } from 'react';
import { formatBalance } from '@/lib/utils/format';

interface Client {
  id: number;
  balanceInSeconds: string;
  estimatedMinutesPerCall: string;
}

interface CampaignStats {
  totalCampaigns: number;
  totalCalls: number;
  totalDuration: number;
}

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    totalCalls: 0,
    totalDuration: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch client data
        const clientResponse = await fetch('/api/clients/me');
        const clientData = await clientResponse.json();
        
        // Fetch campaign stats
        const statsResponse = await fetch('/api/clients/campaign-stats');
        const statsData = await statsResponse.json();
        
        setClient(clientData);
        setCampaignStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  const calculateEstimatedCalls = () => {
    if (!client) return 0;
    
    const balanceInSeconds = parseFloat(client.balanceInSeconds);
    const estimatedMinutesPerCall = parseFloat(client.estimatedMinutesPerCall || '3');
    
    if (estimatedMinutesPerCall <= 0) return 0;
    
    return Math.floor(balanceInSeconds / 60 / estimatedMinutesPerCall);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-full flex flex-col">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Available Balance</h2>
          </div>
          <div className="flex-grow flex flex-col justify-center py-6">
            <div className="text-5xl font-bold text-blue-600 mb-4 text-center">
              {client ? formatBalance(Number(client.balanceInSeconds)) : '0 minutes'}
            </div>
            <div className="mt-6 bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-gray-700">Estimated calls remaining</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{calculateEstimatedCalls()}</p>
              <p className="text-sm text-gray-500 mt-2">
                Based on {client?.estimatedMinutesPerCall || '3'} minutes per call
              </p>
            </div>
          </div>
        </div>
        
        {/* Campaign Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-full flex flex-col">
          <div className="pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Campaign Statistics</h2>
          </div>
          <div className="flex-grow flex flex-col justify-center py-6">
            <div className="text-5xl font-bold text-green-600 mb-4 text-center">
              {campaignStats.totalCampaigns}
            </div>
            <div className="text-center text-gray-600">
              <p className="text-sm uppercase tracking-wide font-medium">Total campaigns</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-gray-700">Successful Calls</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{campaignStats.totalCalls}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-gray-700">Call Duration</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{formatBalance(campaignStats.totalDuration)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
