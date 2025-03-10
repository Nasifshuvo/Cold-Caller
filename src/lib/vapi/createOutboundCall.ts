import { getVapiConfig } from './config';
import { Call } from './types';

export async function createOutboundCall(customerPhoneNumber: string): Promise<Call> {
  const vapiConfig = getVapiConfig();
  const config = vapiConfig.getConfig();
  
  if (!config.phoneNumberId || !config.assistantId) {
    throw new Error('VAPI configuration missing phoneNumberId or assistantId');
  }

  try {
    // Ensure phone number is in international format
    const phoneNumber = customerPhoneNumber.startsWith('+') 
      ? customerPhoneNumber 
      : `+${customerPhoneNumber}`;

    // Create the call payload
    const payload = {
      name: "US Foreclosure Solution",
      type: "outboundPhoneCall",
      phoneNumberId: config.phoneNumberId,
      assistantId: config.assistantId,
      customer: {
        number: phoneNumber
      }
    };


    // Make the API call
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('VAPI API error response:', error);
      throw new Error(`VAPI call failed: ${error.message || 'Unknown error'}`);
    }

    const call = await response.json();
    
    if (!call.id) {
      throw new Error('Failed to get call ID from VAPI');
    }

    return call;
  } catch (error: unknown) {
    console.error('Failed to create outbound call:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
} 