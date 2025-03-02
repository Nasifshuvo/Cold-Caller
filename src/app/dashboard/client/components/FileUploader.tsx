"use client"
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { LeadsData } from "@/types/leadsData";
import axios from "axios";

interface ValidationResult {
  canProceed: boolean;
  totalCost: number;
  possibleCalls: number;
  message: string;
}

const calculateCallEstimates = (
  phoneNumbers: number, 
  estimatedCostPerCall: number, 
  currentBalance: number,
  minimumBalance: number = 2
): ValidationResult => {
  const totalEstimatedCost = phoneNumbers * estimatedCostPerCall;
  const availableBalance = currentBalance - minimumBalance;
  const possibleCalls = Math.floor(availableBalance / estimatedCostPerCall);

  return {
    canProceed: totalEstimatedCost <= availableBalance,
    totalCost: totalEstimatedCost,
    possibleCalls,
    message: totalEstimatedCost > availableBalance
      ? `Warning: The estimated cost for ${phoneNumbers} calls is $${totalEstimatedCost.toFixed(2)}. 
         With your current balance of $${currentBalance.toFixed(2)} (keeping $${minimumBalance.toFixed(2)} minimum), 
         you can only make ${possibleCalls} calls. Please upload a file with ${possibleCalls} or fewer numbers.`
      : `Estimated cost for ${phoneNumbers} calls: $${totalEstimatedCost.toFixed(2)}`
  };
};

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  downloadTemplate?: boolean;
}

export default function FileUploader({ onFileSelect, downloadTemplate = false }: FileUploaderProps) {
  const [isClient, setIsClient] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [clientId, setClientId] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    const fetchClientId = async () => {
      const response = await axios.get('/api/clients/me');
      const data = response.data;
      setClientId(data.id);
    };

    fetchClientId();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/leads/template');
      const blob = await response.blob();
      
      if (isClient) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  }, [isClient]);

  const checkForDuplicates = (data: LeadsData[]): { 
    hasDuplicates: boolean; 
    duplicates: string[];
  } => {
    const phoneNumbers = new Set<string>();
    const duplicates = new Set<string>();

    data.forEach(lead => {
      if (phoneNumbers.has(lead.phoneNumber)) {
        duplicates.add(lead.phoneNumber);
      }
      phoneNumbers.add(lead.phoneNumber);
    });

    return {
      hasDuplicates: duplicates.size > 0,
      duplicates: Array.from(duplicates)
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!clientId) {
      setMessage('Client ID not available');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // First, upload and parse the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (!result.success) {
        setMessage(result.message || "Upload failed");
        return;
      }

      // Check for duplicates first
      const { hasDuplicates, duplicates } = checkForDuplicates(result.data);
      if (hasDuplicates) {
        setMessage(`Duplicate phone numbers found: ${duplicates.join(', ')}. Please remove duplicates and try again.`);
        return;
      }

      // Then get client details for balance and estimated cost
      const clientResponse = await fetch('/api/clients/me');
      const clientData = await clientResponse.json();
      
      // Validate call estimates
      const validation = calculateCallEstimates(
        result.data.length,
        Number(clientData.estimatedCallCost) || 0.08,
        Number(clientData.balance)
      );

      if (!validation.canProceed) {
        setMessage(validation.message);
        return;
      }

      // If validation passes, proceed with creating leads
      const createResponse = await fetch('/api/clients/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          fileName: file.name,
          leads: result.data
        }),
      });

      const createResult = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createResult.error || 'Failed to create leads');
      }

      setMessage(`Upload successful! ${validation.message}`);
      onFileSelect(file);
      
    } catch (error) {
      setMessage("Error uploading file");
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? "Drop the file here..."
            : "Drag 'n' drop a CSV or Excel file here, or click to select"}
        </p>
      </div>
      {downloadTemplate && (
        <button
          onClick={handleDownloadTemplate}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Download Template
        </button>
      )}
      {message && (
        <div className={`mt-4 p-4 rounded-lg ${
          message.includes("Warning") 
            ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
            : message.includes("successful")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          <p className="text-sm whitespace-pre-line font-medium">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}