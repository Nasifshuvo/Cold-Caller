import { getVapiConfig } from './config';
import { Call } from './types';
import { syncSingleCall } from './sync-calls';

export async function createOutboundCall(customerPhoneNumber: string): Promise<Call> {
  const vapiConfig = getVapiConfig();
  
  try {
    // 1. Create call using Vapi API
    const call = await vapiConfig.createCall(customerPhoneNumber);
    
    if (!call.id) {
      throw new Error('Failed to get call ID from Vapi');
    }

    // 2. Sync call with database
    await syncSingleCall(call.id);

    // 3. Return the call data
    return call;

  } catch (error: unknown) {
    console.error('Failed to create and sync outbound call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(errorMessage);
  }
} 