export interface VapiCallResponse {
  id: string;
  assistantId: string;
  phoneNumberId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost: number;
  assistant: Record<string, unknown>;
  customer: {
    number: string;
  };
  status: string;
  phoneCallProvider: string;
  phoneCallProviderId: string;
  phoneCallTransport: string;
  assistantOverrides: Record<string, unknown>;
  name: string;
  monitor: {
    listenUrl: string;
    controlUrl: string;
  };
  transport: Record<string, unknown>;
  endedReason?: string;
}

export interface LeadsData {
  callId?: string;
  phoneNumber: string;
  name?: string;
  callStatus?: string;
  response?: string;
  createdAt?: string;
}