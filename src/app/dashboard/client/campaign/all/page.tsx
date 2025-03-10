"use client"
import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { 
  PlayIcon, 
  ArrowDownTrayIcon, 
  ClipboardDocumentListIcon,
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { Decimal } from '@prisma/client/runtime/library';
import { formatBalance } from '@/lib/utils/format';

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
  createdAt: string;
  actualSeconds: Decimal;
}

// Create a client-only component for the table
interface CampaignTableProps {
  campaigns: Campaign[];
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  handleExport: (id: number) => Promise<void>;
  handleRunCampaign: (id: number) => Promise<void>;
}

const CampaignTable = dynamic(() => Promise.resolve(({ campaigns, getStatusColor, formatDate, handleExport, handleRunCampaign }: CampaignTableProps) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Type
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Progress
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Duration
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Created At
        </th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {campaigns.map((campaign: Campaign) => (
        <tr key={campaign.id}>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">
              {campaign.name}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{campaign.type}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {campaign.processedLeads}/{campaign.totalLeads}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {campaign.actualSeconds ? formatBalance(Number(campaign.actualSeconds)) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatDate(campaign.createdAt)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div className="flex justify-center space-x-2">
              {campaign.status === 'Draft' && (
                <>
                  <Link
                    href={`/dashboard/client/campaign/${campaign.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-md transition-colors duration-200"
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-1.5" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleRunCampaign(campaign.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-200"
                  >
                    <PlayIcon className="w-4 h-4 mr-1.5" />
                    <span>Run</span>
                  </button>
                </>
              )}
              {campaign.status === 'Completed' && (
                <button
                  onClick={() => handleExport(campaign.id)}
                  className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                  <span>Export</span>
                </button>
              )}
              <Link
                href={`/dashboard/client/campaign/${campaign.id}/logs`}
                className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <ClipboardDocumentListIcon className="w-4 h-4 mr-1.5" />
                <span>Logs</span>
              </Link>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)), { ssr: false });

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function AllCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch {
      console.error('Error fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleRunCampaign = async (campaignId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/run`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to run campaign');
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      console.error('Error running campaign:', error);
      alert('Failed to run campaign');
    }
  };

  const handleExport = useCallback(async (campaignId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`);
      const blob = await response.blob();
      
      if (isClient) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${campaignId}-export.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting campaign:', error);
    }
  }, [isClient]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString || !isClient) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  }, [isClient]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Campaigns</h1>
        <Link 
          href="/dashboard/client/campaign/add"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          <CampaignTable 
            campaigns={campaigns} 
            getStatusColor={getStatusColor} 
            formatDate={formatDate}
            handleExport={handleExport}
            handleRunCampaign={handleRunCampaign}
          />
        </Suspense>
      </div>
    </div>
  );
} 