"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileUploader from "../../components/FileUploader";
import { LeadsData } from "@/types/leadsData";
// import { Tooltip } from "@/components/ui/tooltip";

export default function AddCampaign() {
  const router = useRouter();
  const [leadData, setLeadData] = useState<LeadsData[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [clientMinutes, setClientMinutes] = useState(0);
  const [estimatedMinutesPerCall, setEstimatedMinutesPerCall] = useState(3);

  // Fetch client minutes and settings
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const response = await fetch('/api/clients/me');
        const data = await response.json();
        if (response.ok) {
          // Convert balanceInSeconds to minutes
          setClientMinutes(data.balanceInSeconds ? Math.floor(Number(data.balanceInSeconds) / 60) : 0);
          setEstimatedMinutesPerCall(parseFloat(data.estimatedMinutesPerCall || '3'));
        }
      } catch (error) {
        console.error('Error fetching client details:', error);
      }
    };
    fetchClientDetails();
  }, []);

  // Calculate estimated minutes whenever leadData changes
  useEffect(() => {
    setEstimatedMinutes(leadData.length * estimatedMinutesPerCall);
  }, [leadData, estimatedMinutesPerCall]);

  const handleSubmit = async (status: 'draft' | 'running') => {
    if (!campaignName || leadData.length === 0) {
      alert("Please provide campaign name and upload leads");
      return;
    }

    if (status === 'running' && estimatedMinutes > clientMinutes) {
      alert("Insufficient minutes to run this campaign");
      return;
    }

    setLoading(true);
    try {
      // Create campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          type: 'Call',
          status: 'Draft',
          totalLeads: leadData.length,
          leads: leadData,
          estimatedMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }
      
      const campaignResponse = await response.json();
      console.log('Campaign created:', campaignResponse);

      // If status is 'running', call the run endpoint
      if (status === 'running') {
        const runResponse = await fetch(`/api/campaigns/${campaignResponse.data.id}/run`, {
          method: 'POST'
        });

        if (!runResponse.ok) {
          const errorData = await runResponse.json();
          throw new Error(errorData.error || 'Failed to run campaign');
        }
      }

      router.push('/dashboard/client/campaign/all');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Campaign</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Name</label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter campaign name"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select 
              className="w-full p-2.5 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              disabled
              defaultValue="Call"
            >
              <option value="Call">Call Campaign</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Run Campaign</label>
            <div className="flex items-center h-[42px] space-x-6">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  checked={!isScheduled}
                  onChange={() => setIsScheduled(false)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="campaign-timing"
                />
                <span className="ml-2 text-gray-700">Now</span>
              </label>
              <label className="inline-flex items-center opacity-50 cursor-not-allowed">
                <input
                  type="radio"
                  disabled
                  checked={isScheduled}
                  onChange={() => setIsScheduled(true)}
                  className="w-4 h-4 text-gray-400 border-gray-300 cursor-not-allowed"
                  name="campaign-timing"
                />
                <span className="ml-2 text-gray-400">Schedule (Coming Soon)</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload Leads</label>
          <FileUploader setLeadData={setLeadData} />
        </div>

        {estimatedMinutes > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Campaign Estimate</h3>
            <p>Total Leads: {leadData.length}</p>
            <p>Estimated Minutes Required: {estimatedMinutes}</p>
            <p>Your Minutes Balance: {clientMinutes}</p>

            {estimatedMinutes > clientMinutes && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-sm text-red-600">
                  Warning: Your current balance ({clientMinutes} minutes) is insufficient for this campaign.
                  You need {estimatedMinutes - clientMinutes} more minutes.
                </p>
              </div>
            )}
          </div>
        )}

        {leadData.length > 0 && (
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Campaign Summary</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Phone Numbers</h3>
                <p className="text-2xl font-bold text-gray-900">{leadData.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estimated Campaign Duration</h3>
                <p className="text-2xl font-bold text-gray-900">{estimatedMinutes} minutes</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Your Current Balance</h3>
                <p className={`text-2xl font-bold ${clientMinutes < estimatedMinutes ? 'text-red-600' : 'text-green-600'}`}>
                  {clientMinutes} minutes
                </p>
              </div>
            </div>

            {clientMinutes < estimatedMinutes && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-sm text-red-600 font-medium">
                  Warning: Your current balance is insufficient for this campaign.
                  You need {estimatedMinutes - clientMinutes} more minutes.
                </p>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Phone Numbers</h3>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leadData.map((lead, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{lead.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        

        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {loading ? 'Processing...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSubmit('running')}
            disabled={loading || estimatedMinutes > clientMinutes}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              loading || estimatedMinutes > clientMinutes
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Processing...' : 'Run Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
} 