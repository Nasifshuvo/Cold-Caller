"use client"
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Call {
  id: number;
  callStatus: string;
  response?: string;
  createdAt: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
  customerNumber: string;
  transcript?: string;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
}

export default function CampaignLogs() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaignDetails = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      // Fetch campaign details
      const campaignResponse = await fetch(`/api/campaigns/${params.id}`);
      if (!campaignResponse.ok) throw new Error('Failed to fetch campaign');
      const campaignData = await campaignResponse.json();
      setCampaign(campaignData);

      // Fetch campaign calls
      const callsResponse = await fetch(`/api/campaigns/${params.id}/calls`);
      if (!callsResponse.ok) throw new Error('Failed to fetch calls');
      const callsData = await callsResponse.json();
      setCalls(callsData);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/dashboard/client/campaign/all"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Campaigns
        </Link>
        
        {campaign && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Campaign: {campaign.name}</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{campaign.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-medium">{campaign.processedLeads}/{campaign.totalLeads} calls completed</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Call Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ended At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{call.customerNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(call.callStatus)}`}>
                        {call.callStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(call.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(call.endedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {call.endedAt ? 
                        Math.round((new Date(call.endedAt).getTime() - new Date(call.createdAt).getTime()) / 1000) + 's' 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {call.cost ? `$${call.cost.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-xs truncate">
                        {call.response || call.endedReason || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 