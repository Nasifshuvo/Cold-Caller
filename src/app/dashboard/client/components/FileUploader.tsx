"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LeadsData } from '@/types/leadsData';

interface FileUploaderProps {
  setLeadData: (data: LeadsData[]) => void;
}

export default function FileUploader({ setLeadData }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFile(file);
    setMessage('');
    setMessageType('info');
    setUploading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('');
    setMessageType('info');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }

      // Check for duplicates
      const uniqueData = result.data.filter((item: { phoneNumber: string }, index: number, self: { phoneNumber: string }[]) => 
        index === self.findIndex((t: { phoneNumber: string }) => t.phoneNumber === item.phoneNumber)
      );

      setLeadData(uniqueData);
      const duplicateCount = result.data.length - uniqueData.length;
      let messageText = '';
      if (duplicateCount > 0) {
        messageText = `<span class="text-yellow-800 font-semibold">${duplicateCount} Duplicate phone number${duplicateCount > 1 ? 's' : ''} found</span>\n`;
        messageText += `<span class="text-gray-700">Duplicate phone numbers removed\n`;
        messageText += `${uniqueData.length} numbers added successfully</span>`;
        setMessageType('warning');
      } else {
        messageText = `Successfully imported ${uniqueData.length} leads`;
        setMessageType('success');
      }
      setMessage(messageText);
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to upload file');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Upload CSV File
          </label>
          <input
            type="file"
            id="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>
        {message && (
          <div className={`p-4 rounded-md ${
            messageType === 'error' ? 'bg-red-50 text-red-700' :
            messageType === 'success' ? 'bg-green-50 text-green-700' :
            messageType === 'warning' ? 'bg-yellow-50 text-yellow-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            <div dangerouslySetInnerHTML={{ __html: message }} />
          </div>
        )}
        <Button
          type="submit"
          disabled={!file || uploading}
          isLoading={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>
    </div>
  );
}