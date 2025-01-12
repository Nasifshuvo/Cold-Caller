"use client"
import FileUploader from "./components/FileUploader";
import { LeadsData } from "@/types/leadsData";
import { useState } from "react";
import LeadsTable from "./components/LeadsTable";
import { createOutboundCall } from "@/utils/createOutboundCall";
import { getCall } from "@/utils/getCall";
import { Button } from "@/components/ui/Button";

export default function Dashboard() {
  const [leadData, setLeadData] = useState<LeadsData[]>([]);
  const [callMessages, setCallMessages] = useState<string>();

  // Helper function to check if any calls are not initiated
  const hasNotInitiatedCalls = (leads: LeadsData[]) => {
    return leads.some(lead => !lead.callStatus || lead.callStatus === 'Not Initiated');
  };

  // Update initiateCalls function
  const initiateCalls = async () => {
    // First set all not initiated calls to Pending
    const updatedLeadData = leadData.map(lead => ({
      ...lead,
      callStatus: !lead.callStatus || lead.callStatus === 'Not Initiated' 
        ? 'Pending' 
        : lead.callStatus
    }));
    setLeadData(updatedLeadData);
    
    for (let index = 0; index < updatedLeadData.length; index++) {
      const lead = updatedLeadData[index];
      if (lead.callStatus !== 'Pending') continue;

      setCallMessages(`Initiating ${index + 1} of ${leadData.length} calls`);
      
      try {
        const callResponse = await createOutboundCall(lead.phoneNumber);
        if (callResponse.id) {
          updatedLeadData[index] = {
            ...lead,
            callId: callResponse.id,
            callStatus: 'Initiated',
            createdAt: callResponse.createdAt,
            callResponse: callResponse
          };
          setLeadData([...updatedLeadData]);

          setCallMessages(`Waiting 2 minutes to finish the call...`);
          await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
          
          const getCallResponse = await getCall(callResponse.id);
          updatedLeadData[index] = {
            ...updatedLeadData[index],
            callStatus: 'Done',
            endedReason: getCallResponse.endedReason,
            getCallResponse: getCallResponse
          };
          setLeadData([...updatedLeadData]);
        }
      } catch (error) {
        console.error(`Call failed for ${lead.phoneNumber}:`, error);
        updatedLeadData[index] = {
          ...lead,
          callStatus: 'Failed'
        };
        setLeadData([...updatedLeadData]);
      }

      // if (index < updatedLeadData.length - 1) {
      //   setCallMessages(`Waiting 5 minutes before next call...`);
      //   await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      // }
    }
    setCallMessages(`All calls completed`);
  };

  const handleDownloadSample = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clients/sample-csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample-messages.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return(
    <div>
      <FileUploader leadData={leadData} setLeadData={setLeadData}/>
      <div className="flex items-center justify-between mx-auto p-4 space-x-4">
        <button 
          onClick={initiateCalls}
          disabled={!hasNotInitiatedCalls(leadData)}
          className={`px-6 py-2 rounded-lg font-medium text-white transition-all duration-200
            ${hasNotInitiatedCalls(leadData)
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
              : 'bg-gray-400 cursor-not-allowed'
            }
            shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
        >
          {hasNotInitiatedCalls(leadData) ? 'Initiate Calls' : 'No Calls to Process'}
        </button>

        {callMessages && (
          <div className="flex-1 text-right">
            <span className="inline-block px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
              {callMessages}
            </span>
          </div>
        )}
      </div>
      <div className="table-container">
        <LeadsTable leadData={leadData}/>
      </div>
      {/* <Button onClick={handleDownloadSample} variant="secondary">
        Download Sample CSV
      </Button> */}
    </div>
  )
}
