"use client"
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FileUploader from "../../../components/FileUploader";
import { LeadsData } from "@/types/leadsData";
import { Lead } from "@prisma/client";

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
  estimatedCost: number;
  leads: Lead[];
}

export default function EditCampaign() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [leadData, setLeadData] = useState<LeadsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const fetchCampaign = useCallback(async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/campaigns/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      const data = await response.json();
      
      setCampaign(data);
      setCampaignName(data.name);
      // Initialize leadData with existing leads
      const initialLeads = data.leads?.map((lead: Lead) => ({
        phoneNumber: lead.phoneNumber,
        name: lead.name || null
      })) || [];
      setLeadData(initialLeads);
      setEstimatedCost(parseFloat(data.estimatedCost));
    } catch (error) {
      console.error('Error fetching campaign:', error);
      alert('Failed to fetch campaign');
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (!params?.id) {
      router.push('/dashboard/client/campaign/all');
      return;
    }
    fetchCampaign();
  }, [params?.id, router, fetchCampaign]);

  // Calculate estimated cost whenever leadData changes
  useEffect(() => {
    const costPerCall = 2;
    setEstimatedCost(leadData.length * costPerCall);
  }, [leadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
    
    if (!campaignName || leadData.length === 0) {
      alert("Please provide campaign name and upload leads");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          totalLeads: leadData.length,
          leads: leadData,
          estimatedCost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update campaign');
      }

      router.push('/dashboard/client/campaign/all');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">Campaign not found</p>
        </div>
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
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
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
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/dashboard/client/campaign/all"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 