"use client"
import { useState } from "react";
import { LeadsData } from "@/types/leadsData";
export default function FileUploader({leadData, setLeadData}: {leadData: LeadsData[], setLeadData: (data: LeadsData[]) => void}) {
    const [message, setMessage] = useState<string>("");
    const [isDragging, setIsDragging] = useState<boolean>(false);

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
        const file = event.target.files?.[0];
        if (!file) return;
        // if (!file || !session?.user?.id) return;
    
        const formData = new FormData();
        formData.append('file', file);
        // formData.append('userId', session.user.id);
    
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          
          if (result.success) {
            setMessage("Upload successful!");
            console.log("Phones:", result.data);
            prepareLeadData(result.data);
            // fetchLeads(); // Refresh leads after upload
          } else {
            setMessage(result.message || "Upload failed");
          }
        } catch (error) {
          setMessage("Error uploading file");
          console.error(error);
        }
      };
      const prepareLeadData = (phones: {phoneNumber: string, createdAt: string}[]) => {
        const leadData: LeadsData[] = phones.map((phone: any) => ({
            phoneNumber: phone.phoneNumber,
            callId: "",
            callStatus: "Not Initiated",
            response: "-",
            createdAt: phone.createdAt
        }));
        setLeadData(leadData);
    }
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