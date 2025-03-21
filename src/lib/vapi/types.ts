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
  limit?: number;
  before?: string;
  after?: string;
  status?: string;
}

export interface CreateCallDTO {
  assistantId: string;
  phoneNumberId?: string;
  type: 'outboundPhoneCall' | 'webCall';
}

export interface UpdateCallDTO {
  status?: string;
  endedReason?: string;
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
export interface ListAssistantsParams extends PaginationParams {
  id?: string;
}

export interface CreateAssistantDTO {
  name: string;
  model: string;
}

export interface UpdateAssistantDTO {
  name?: string;
  model?: string;
}

export interface Assistant {
  id: string;
  name: string;
  model: string;
}

// Phone Number types
export interface ListPhoneNumbersParams extends PaginationParams {
  id?: string;
}

export interface CreatePhoneNumberDTO {
  phoneNumber: string;
  name?: string;
}

export interface UpdatePhoneNumberDTO {
  name?: string;
}

export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  name?: string;
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
  initialize(config: VapiConfig): Promise<void>;
  getCall(id: string): Promise<Call>;
  getConfig(): VapiConfig;
  updateConfig(newConfig: Partial<VapiConfig>): void;
}

// Remove unused empty interfaces/types 