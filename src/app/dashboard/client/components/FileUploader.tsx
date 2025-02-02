"use client"
import { useState, useEffect } from "react";
import { LeadsData } from "@/types/leadsData";
import axios from "axios";

export default function FileUploader({setLeadData}: {
  setLeadData: (data: LeadsData[]) => void
}) {
    const [message, setMessage] = useState<string>("");
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [clientId, setClientId] = useState<number | null>(null);

    useEffect(() => {
        const fetchClientId = async () => {
            const response = await axios.get('/api/clients/me');
            const data = response.data;
            setClientId(data.id);
        };

        fetchClientId();
    }, []);

    const handleDownloadSample = async (e: React.MouseEvent<HTMLAnchorElement>) => {
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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!clientId) {
            setMessage('Client ID not available');
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        console.log("Going to upload file");

        try {
            // First, upload the file
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            
            if (!result.success) {
                setMessage(result.message || "Upload failed");
                return;
            }
            console.log("Result:", result);
            console.log("Creating Leads...");
            // Then create leads through the API endpoint
            const createResponse = await fetch('/api/clients/leads/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId,
                    fileName: file.name,
                    leads: result.data
                }),
            });

            console.log('Sending data:', {
                clientId,
                fileName: file.name,
                leads: result.data
            });

            const createResult = await createResponse.json();
            if (!createResponse.ok) {
                throw new Error(createResult.error || 'Failed to create leads');
            }

            setMessage("Upload successful!");
            setLeadData(result.data);
            
        } catch (error) {
            setMessage("Error uploading file");
            console.error(error);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto p-6">
            <div 
                className={`relative border-2 border-dashed rounded-lg p-8 text-center
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                    hover:border-blue-500 transition-colors duration-200 ease-in-out`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <svg 
                            className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <p className="text-base font-medium text-gray-700">
                        Drop your CSV file here, or click to browse
                    </p>
                </div>
            </div>

            <p className="text-sm text-gray-500 mt-2 text-center">
                Only CSV files are supported (
                <a 
                    href="#" 
                    onClick={handleDownloadSample}
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    download sample
                </a>
                )
            </p>

            {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                    message.includes("Error") 
                        ? "bg-red-50 text-red-700" 
                        : "bg-green-50 text-green-700"
                }`}>
                    <p className="text-sm font-medium">
                        {message}
                    </p>
                </div>
            )}
        </div>
    )
}