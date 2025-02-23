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
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [clientBalance, setClientBalance] = useState(0);

  // Fetch client balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/clients/balance');
        const data = await response.json();
        if (response.ok) {
          setClientBalance(parseFloat(data.balance));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    fetchBalance();
  }, []);

  // Calculate estimated cost whenever leadData changes
  useEffect(() => {
    // Assuming $2 per call
    const costPerCall = 2;
    setEstimatedCost(leadData.length * costPerCall);
  }, [leadData]);

  const handleSubmit = async (status: 'draft' | 'running') => {
    if (!campaignName || leadData.length === 0) {
      alert("Please provide campaign name and upload leads");
      return;
    }

    if (status === 'running' && estimatedCost > clientBalance) {
      alert("Insufficient balance to run this campaign");
      return;
    }

    setLoading(true);
    try {
      console.log('Creating campaign with data:', {
        name: campaignName,
        type: 'Call',
        status: 'Draft', // Always create as Draft first
        totalLeads: leadData.length,
        leads: leadData,
        estimatedCost,
      });

      // Create campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          type: 'Call',
          status: 'Draft', // Always create as Draft first
          totalLeads: leadData.length,
          leads: leadData,
          estimatedCost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error(errorData.error || 'Failed to create campaign');
      }
      
      const campaign = await response.json();
      console.log('Campaign created:', campaign);

      // If status is 'running', call the run endpoint
      if (status === 'running') {
        console.log('Starting campaign calls...');
        const runResponse = await fetch(`/api/campaigns/${campaign.id}/run`, {
          method: 'POST'
        });

        if (!runResponse.ok) {
          const errorData = await runResponse.json();
          throw new Error(errorData.error || 'Failed to run campaign');
        }

        console.log('Campaign started successfully');
      }

      router.push('/dashboard/client/campaign/all');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create campaign');
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

        {leadData.length > 0 && (
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Campaign Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Phone Numbers</h3>
                <p className="text-2xl font-bold text-gray-900">{leadData.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estimated Campaign Cost</h3>
                <p className="text-2xl font-bold text-gray-900">${estimatedCost.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Phone Numbers</h3>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leadData.map((lead, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{lead.name || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{lead.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {estimatedCost > clientBalance && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-sm text-red-600">
                  Warning: Your current balance (${clientBalance.toFixed(2)}) is insufficient for this campaign.
                </p>
              </div>
            )}
          </div>
        )}

        {leadData.length > 0 && (
          <div className="flex space-x-4">
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
              disabled={loading || estimatedCost > clientBalance}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                loading || estimatedCost > clientBalance
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Processing...' : 'Run Campaign'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 