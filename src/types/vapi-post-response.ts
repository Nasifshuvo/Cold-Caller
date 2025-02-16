// Common interfaces used across all message types
interface CallMetadata {
    id: string;
    orgId: string;
    createdAt: string;
    updatedAt: string;
    type: "webCall";
    monitor: {
      listenUrl: string;
      controlUrl: string;
    };
    transport: {
      assistantVideoEnabled: boolean;
    };
    webCallUrl: string;
    status: "queued" | "in-progress" | "ended";
    assistantId: string;
    assistantOverrides: {
      clientMessages: string[]; // e.g., ["transfer-update", "transcript"]
    };
  }
  
  interface AssistantMetadata {
    id: string;
    orgId: string;
    name: string;
    voice: {
      model: string; // e.g., "eleven_turbo_v2_5"
      voiceId: string; // e.g., "sarah"
      provider: string; // e.g., "11labs"
      stability: number;
      similarityBoost: number;
      fillerInjectionEnabled: boolean;
    };
    createdAt: string;
    updatedAt: string;
    model: {
      model: string; // e.g., "gpt-4o-mini"
      toolIds: string[];
      messages: {
        role: "system";
        content: string;
      }[];
      provider: string;
      temperature: number;
      tools: any[]; // TODO: Define the type for 'tools' array
    };
    recordingEnabled: boolean;
    firstMessage: string;
    voicemailMessage: string;
    endCallFunctionEnabled: boolean;
    endCallMessage: string;
    transcriber: {
      model: string; // e.g., "nova-2"
      language: string; // e.g., "en"
      provider: string; // e.g., "deepgram"
    };
    silenceTimeoutSeconds: number;
    clientMessages: string[];
    serverMessages: string[];
    serverUrl: string;
    serverUrlSecret: string;
    endCallPhrases: string[];
    hipaaEnabled: boolean;
    backchannelingEnabled: boolean;
    backgroundDenoisingEnabled: boolean;
    startSpeakingPlan: {
      waitSeconds: number;
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: number;
      };
    };
  }
  
  interface ArtifactMessage {
    role: "system" | "bot" | "user";
    message: string;
    time: number;
    secondsFromStart?: number; // Only in some messages
    endTime?: number;
    duration?: number;
    source?: string;
  }
  
  // Main message interfaces
  
  interface StatusUpdateInProgressMessage {
    message: {
      timestamp: number;
      type: "status-update";
      status: "in-progress";
      artifact: {
        messages: ArtifactMessage[];
        messagesOpenAIFormatted: {
          role: "system";
          content: string;
        }[];
      };
      call: CallMetadata;
      assistant: AssistantMetadata;
    };
  }
  
  interface StatusUpdateEndedMessage {
    message: {
      timestamp: number;
      type: "status-update";
      status: "ended";
      endedReason: string;
      artifact: {
        messages: ArtifactMessage[];
        messagesOpenAIFormatted: {
          role: "system" | "assistant" | "user";
          content: string;
        }[];
      };
      call: CallMetadata;
      assistant: AssistantMetadata;
    };
  }
  
  interface EndOfCallReportMessage {
    message: {
      timestamp: number;
      type: "end-of-call-report";
      analysis: {
        summary: string;
        successEvaluation: "true" | "false";
      };
      artifact: {
        messages: ArtifactMessage[];
        messagesOpenAIFormatted: {
          role: "system" | "assistant" | "user";
          content: string;
        }[];
        transcript: string;
        recordingUrl: string;
        stereoRecordingUrl: string;
      };
      startedAt: string;
      endedAt: string;
      endedReason: string;
      cost: number;
      costBreakdown: {
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
          summaryPromptTokens: number;
          summaryCompletionTokens: number;
          structuredData: number;
          structuredDataPromptTokens: number;
          structuredDataCompletionTokens: number;
          successEvaluation: number;
          successEvaluationPromptTokens: number;
          successEvaluationCompletionTokens: number;
        };
      };
      costs: {
        type: string; // e.g., "transcriber", "model", "voice", "vapi", "analysis"
        transcriber?: {
          provider: string;
          model: string;
        };
        model?: {
          provider: string;
          model: string;
        };
        voice?: {
          provider: string;
          voiceId: string;
          model: string;
        };
        subType?: string; // e.g., "normal"
        minutes?: number;
        promptTokens?: number;
        completionTokens?: number;
        characters?: number;
        cost: number;
        analysisType?: string;
      }[];
      durationMs: number;
      durationSeconds: number;
      durationMinutes: number;
      summary: string;
      transcript: string;
      messages: ArtifactMessage[];
      recordingUrl: string;
      stereoRecordingUrl: string;
      call: CallMetadata;
      assistant: AssistantMetadata;
    };
  }
  
  // Union type for all possible messages
  
  export type VapiMessage =
    | StatusUpdateInProgressMessage
    | StatusUpdateEndedMessage
    | EndOfCallReportMessage;