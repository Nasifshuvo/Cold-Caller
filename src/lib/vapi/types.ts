// Common parameter types
export interface PaginationParams {
  limit?: number;
  createdAtGt?: string;
  createdAtLt?: string;
  createdAtGe?: string;
  createdAtLe?: string;
  updatedAtGt?: string;
  updatedAtLt?: string;
  updatedAtGe?: string;
  updatedAtLe?: string;
}

// Call types
export interface ListCallsParams extends PaginationParams {
  id?: string;
  assistantId?: string;
  phoneNumberId?: string;
}

export interface CreateCallDTO {
  // Add properties based on schema
}

export interface UpdateCallDTO {
  // Add properties based on schema
}

export interface Call {
  id: string;
  assistantId: string;
  phoneNumberId?: string;
  type: 'outboundPhoneCall' | 'webCall';
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost: number;
  customer?: {
    number: string;
  };
  status: 'ended' | string;
  endedReason: string;
  messages: CallMessage[];
  stereoRecordingUrl: string;
  costBreakdown: {
    transport?: number;
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
    analysisCostBreakdown: {
      summary: number;
      structuredData: number;
      successEvaluation: number;
      summaryPromptTokens: number;
      summaryCompletionTokens: number;
      structuredDataPromptTokens: number;
      successEvaluationPromptTokens: number;
      structuredDataCompletionTokens: number;
      successEvaluationCompletionTokens: number;
    };
  };
  analysis: {
    summary?: string;
    successEvaluation?: string;
  };
  webCallUrl?: string;
}

export interface CallMessage {
  role: 'system' | 'bot' | 'user' | 'tool_calls' | 'tool_call_result';
  time: number;
  message: string;
  source?: string;
  endTime?: number;
  duration?: number;
  secondsFromStart: number;
  toolCalls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  name?: string;
  result?: string;
  toolCallId?: string;
}

// Assistant types
export interface ListAssistantsParams extends PaginationParams {}

export interface CreateAssistantDTO {
  // Add properties based on schema
}

export interface UpdateAssistantDTO {
  // Add properties based on schema
}

export interface Assistant {
  // Add properties based on schema
}

// Phone Number types
export interface ListPhoneNumbersParams extends PaginationParams {}

export interface CreatePhoneNumberDTO {
  // Add properties based on schema
}

export interface UpdatePhoneNumberDTO {
  // Add properties based on schema
}

export interface PhoneNumber {
  // Add properties based on schema
}

export interface VapiConfig {
  apiKey: string;
  baseURL?: string;
  assistantId?: string;
  phoneNumberId?: string;
  defaultCallSettings?: {
    recordingEnabled?: boolean;
    transcriptionEnabled?: boolean;
  };
}

export interface VapiConfiguration {
  init(config: VapiConfig): void;
  isInitialized(): boolean;
  listCalls(): Promise<Call[]>;
} 