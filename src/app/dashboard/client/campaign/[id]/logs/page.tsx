"use client"
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Call {
  id: number;
  leadId?: number;
  clientId: number;
  callStatus: string;
  response?: string | null;
  createdAt: string;
  updatedAt: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  } | null;
  assistantId?: string;
  cost?: string | number;
  costBreakdown?: {
    llm: number;
    stt: number;
    tts: number;
    vapi: number;
    total: number;
    ttsCharacters: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    analysisCostBreakdown?: {
      summary: number;
      structuredData: number;
      successEvaluation: number;
    };
  };
  customerNumber?: string;
  endedAt?: string;
  endedReason?: string;
  final_cost?: number | null;
  messages?: Array<{
    role: string;
    time: number;
    message: string;
    secondsFromStart: number;
    endTime?: number;
    duration?: number;
  }>;
  recordingUrl?: string;
  startedAt?: string;
  stereoRecordingUrl?: string;
  summary?: string;
  transcript?: string;
  type?: string;
  vapiCallId?: string;
  webCallUrl?: string;
  costDeducted: boolean;
  campaignId?: number;
  durationInSeconds?: number;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
  estimatedMinutes: number;
  actualMinutes: number;
}

function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-4 flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-gray-800 whitespace-pre-wrap">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignLogs() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchCampaignDetails = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      const [campaignResponse, callsResponse] = await Promise.all([
        fetch(`/api/campaigns/${params.id}`),
        fetch(`/api/campaigns/${params.id}/calls`)
      ]);

      if (!campaignResponse.ok) throw new Error('Failed to fetch campaign');
      if (!callsResponse.ok) throw new Error('Failed to fetch calls');

      const [campaignData, callsData] = await Promise.all([
        campaignResponse.json(),
        callsResponse.json()
      ]);
      console.log("callsData", callsData);
      setCampaign(campaignData);
      setCalls(callsData);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  // Handle initial data fetching
  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString || !isClient) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return '';
    }
  }, [isClient]);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const handleExport = useCallback(async () => {
    if (!campaign || !calls.length || exporting) return;
    
    try {
      setExporting(true);
      
      // Prepare campaign data
      const campaignData = {
        name: campaign.name,
        status: campaign.status,
        totalLeads: campaign.totalLeads,
        processedLeads: campaign.processedLeads,
        estimatedMinutes: campaign.estimatedMinutes,
        actualMinutes: campaign.actualMinutes
      };
      
      // Prepare calls data
      const callsData = calls.map(call => ({
        phoneNumber: call.customerNumber,
        status: call.callStatus,
        startedAt: call.createdAt,
        duration: call.durationInSeconds ? `${call.durationInSeconds}s` : '',
        minutes: call.durationInSeconds ? (call.durationInSeconds / 60).toFixed(2) : '',
        response: call.analysis?.summary || call.response || call.endedReason || ''
      }));
      
      // Convert to CSV content
      const csvContent = [
        // Campaign section
        ['Campaign Details'],
        ['Name', 'Status', 'Total Leads', 'Processed Leads', 'Estimated Minutes', 'Actual Minutes'],
        [
          campaignData.name,
          campaignData.status,
          campaignData.totalLeads,
          campaignData.processedLeads,
          campaignData.estimatedMinutes,
          campaignData.actualMinutes
        ],
        [], // Empty line for separation
        // Calls section
        ['Calls'],
        ['Phone Number', 'Status', 'Started At', 'Duration', 'Minutes Used', 'Response'],
        ...callsData.map(call => [
          call.phoneNumber,
          call.status,
          call.startedAt,
          call.duration,
          call.minutes,
          call.response
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `campaign_${campaign.name}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  }, [campaign, calls, exporting]);

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
        <div className="flex justify-between items-center mb-4">
          <Link 
            href="/dashboard/client/campaign/all"
            className="text-blue-600 hover:text-blue-800 inline-block"
          >
            ← Back to Campaigns
          </Link>
          <button
            onClick={handleExport}
            disabled={exporting || !campaign || !calls.length}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
        
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
                <p className="font-medium">{campaign.processedLeads}/{campaign.totalLeads} calls processed</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ended Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutes Used</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {call.endedReason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isClient ? formatDate(call.createdAt) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isClient ? (call.durationInSeconds ? `${call.durationInSeconds}s` : '') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isClient ? (call.durationInSeconds ? (call.durationInSeconds / 60).toFixed(2) : '') : ''}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors"
                        onClick={() => setSelectedResponse(call.analysis?.summary || call.response || call.endedReason || '')}
                      >
                        View Response
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <Modal 
        isOpen={!!selectedResponse} 
        onClose={() => setSelectedResponse(null)}
      >
        {selectedResponse}
      </Modal>
    </div>
  );
} 