"use client"
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { LeadsData } from '@/types/leadsData';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  setLeadData: (data: LeadsData[]) => void;
}

export default function FileUploader({ setLeadData }: FileUploaderProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
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
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to upload file');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  }, [setLeadData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleDownloadSample = () => {
    const sampleData = [
      ['phoneNumber'],
      ['1234567890'],
      ['9876543210']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_leads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadSample}
          variant="secondary"
          className="text-sm"
        >
          Download Sample CSV
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-violet-500 bg-violet-50' 
            : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the CSV file here...</p>
            ) : uploading ? (
              <p>Uploading...</p>
            ) : (
              <p>Drag and drop a CSV file here, or click to select</p>
            )}
          </div>
          <p className="text-sm text-gray-500">Only CSV files are supported</p>
        </div>
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
    </div>
  );
}