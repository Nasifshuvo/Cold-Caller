'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Lead {
  id: number;
  phoneNumber: string;
  name?: string;
  callStatus: string;
  response?: string;
  createdAt: string;
}

interface ImportDetails {
  id: number;
  fileName: string;
  totalLeads: number;
  createdAt: string;
  leads: Lead[];
}

export default function ImportDetailsPage() {
  const params = useParams<{ id: string }>();
  const [importDetails, setImportDetails] = useState<ImportDetails | null>(null);

  useEffect(() => {
    const fetchImportDetails = async () => {
      if (!params?.id) return;
      const response = await fetch(`/api/clients/imports/${params.id}`);
      const data = await response.json();
      setImportDetails(data);
    };
    fetchImportDetails();
  }, [params?.id]); // Use optional chaining to handle null case

  if (!importDetails) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Import Details</h1>
          <p className="mt-2 text-sm text-gray-700">
            File: {importDetails.fileName} | Total Leads: {importDetails.totalLeads} | 
            Date: {new Date(importDetails.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Phone Number
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Call Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Response
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {importDetails.leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {lead.phoneNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {lead.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {lead.callStatus}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {lead.response || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 