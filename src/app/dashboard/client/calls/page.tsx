'use client';

import { useState, useEffect } from 'react';
import { getVapiConfig } from '@/lib/vapi';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import { getCallRateMultiplier } from '@/utils/getSettings';

// These are JSON fields that can have varying structures
type Call = {
  status: string;
  id: number;
  leadId?: number;
  clientId: number;
  callStatus: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis?: any;
  assistantId?: string;
  cost?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  costBreakdown?: any;
  customerNumber?: string;
  endedAt?: Date;
  endedReason?: string;
  final_cost?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages?: any;
  recordingUrl?: string;
  startedAt?: Date;
  stereoRecordingUrl?: string;
  summary?: string;
  transcript?: string;
  type?: string;
  vapiCallId?: string;
  webCallUrl?: string;
  costDeducted: boolean;
  client: {
    id: number;
    name?: string;
  };
  lead?: {
    id: number;
    name?: string;
  };
};

const AudioPlayer = ({ url, onClose }: { url: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        <audio controls autoPlay>
          <source src={url} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const DetailsModal = ({ call, onClose }: { call: Call; onClose: () => void }) => {
  // Function to format transcript into colored blocks
  const formatTranscript = (transcript: string) => {
    if (!transcript) return <p>No transcript available</p>;
    
    return transcript.split('\n').map((line, index) => {
      if (line.startsWith('AI:')) {
        return (
          <div key={index} className="mb-2">
            <p className="text-blue-600 font-medium">{line.split('AI:')[0]}AI:</p>
            <p className="pl-4 text-blue-800">{line.split('AI:')[1]}</p>
          </div>
        );
      } else if (line.startsWith('User:')) {
        return (
          <div key={index} className="mb-2">
            <p className="text-green-600 font-medium">{line.split('User:')[0]}User:</p>
            <p className="pl-4 text-green-800">{line.split('User:')[1]}</p>
          </div>
        );
      }
      return <p key={index}>{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 h-[80vh] flex flex-col max-w-4xl">
        {/* Fixed Header */}
        <Tab.Group className="flex flex-col h-full">
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 m-4">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected ? 'bg-white text-blue-700 shadow' : 'text-blue-500 hover:bg-white/[0.12]'}`
            }>
              Summary
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected ? 'bg-white text-blue-700 shadow' : 'text-blue-500 hover:bg-white/[0.12]'}`
            }>
              Transcript
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected ? 'bg-white text-blue-700 shadow' : 'text-blue-500 hover:bg-white/[0.12]'}`
            }>
              Recording
            </Tab>
          </Tab.List>

          {/* Scrollable Content */}
          <Tab.Panels className="flex-1 overflow-auto px-4">
            <Tab.Panel className="h-full">
              <div className="max-w-full break-words">
                <p className="text-gray-700">{call.summary || 'No summary available'}</p>
              </div>
            </Tab.Panel>
            <Tab.Panel className="h-full">
              <div className="max-w-full break-words bg-gray-50 p-4 rounded-lg">
                {formatTranscript(call.transcript || '')}
              </div>
            </Tab.Panel>
            <Tab.Panel className="h-full">
              <audio controls className="w-full">
                <source src={call.recordingUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Fixed Footer */}
        <div className="p-4 border-t">
          <button 
            onClick={onClose}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const { data: session } = useSession();
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [rateMultiplier, setRateMultiplier] = useState(2);
  const [loading, setLoading] = useState(false);

  async function fetchAndSyncCalls() {
    try {
      setLoading(true);
      const vapiConfig = getVapiConfig();
      console.log('Initial Vapi state:', vapiConfig.isInitialized());

      if (!vapiConfig.isInitialized() && session?.user?.id) {
        const response = await fetch('/api/clients/me');
        const client = await response.json();
        
        if (client?.vapiKey && client.vapiAssistantId) {
          vapiConfig.init({
            apiKey: client.vapiKey,
            assistantId: client.vapiAssistantId,
          });
        }
      }

      // Fetch all calls
      const vapiCalls = await vapiConfig.listCalls({
        createdAtGt: '2024-01-01', // Optional: Set a start date if needed
      });

      await fetch('/api/clients/vapi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vapiCalls),
      });

      const dbResponse = await fetch('/api/clients/vapi/calls');
      const dbCalls = await dbResponse.json();
      
      // Sort calls in descending order by creation date (latest first)
      const sortedCalls = dbCalls.sort((a: Call, b: Call) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setCalls(sortedCalls);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchAndSyncCalls();
    }
  }, [session]);

  useEffect(() => {
    const fetchMultiplier = async () => {
      const multiplier = await getCallRateMultiplier();
      setRateMultiplier(multiplier);
    };
    fetchMultiplier();
  }, []);

  function formatDuration(startedAt: string, endedAt: string) {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  const totalCost = calls.reduce((sum, call) => {
    const callCost = call.cost || 0;
    return sum + (callCost * rateMultiplier);
  }, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Calls</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all your Vapi calls</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Started At
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Duration
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Cost
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {call.type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDateTime(call.startedAt?.toString() || '')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDuration(call.startedAt?.toString() || '', call.endedAt?.toString() || '')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {call.status || 'No Status'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${((call.cost || 0) * rateMultiplier).toFixed(2)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button 
                        onClick={() => setSelectedCall(call)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selectedAudio && (
        <AudioPlayer 
          url={selectedAudio} 
          onClose={() => setSelectedAudio(null)} 
        />
      )}
      {selectedCall && (
        <DetailsModal 
          call={selectedCall} 
          onClose={() => setSelectedCall(null)} 
        />
      )}
    </div>
  );
} 