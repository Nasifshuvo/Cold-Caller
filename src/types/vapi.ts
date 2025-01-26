export interface VapiMessage {
  role: string;
  message?: string;
  time: number;
  endTime?: number;
  duration?: number;
  secondsFromStart: number;
  source?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    }
  }>;
}

export interface BookingAppointmentArgs {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: BookingAppointmentArgs | Record<string, any>;
  }
}

export interface VapiToolCallPayload {
  message: {
    timestamp: number;
    type: string;
    call: {
      id: string;
      org_id: string;
      created_at: string;
      updated_at: string;
      type: string;
      monitor: {
        listen_url: string;
        control_url: string;
      };
      transport: {
        assistant_video_enabled: boolean;
      };
      web_call_url: string;
      status: string;
      assistant_id: string;
      assistant_overrides: {
        client_messages: string[];
      };
    };
    artifact: {
      messages: VapiMessage[];
      messagesOpenAIFormatted: Array<{
        role: string;
        content: string;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: {
            name: string;
            arguments: string;
          }
        }>;
      }>;
      transcript: string;
      recording_url: string;
      stereo_recording_url: string;
    };
    assistant: {
      id: string;
      name: string;
      model: {
        model: string;
        tools: Array<{
          id: string;
          type: string;
          function: {
            name: string;
            parameters: {
              type: string;
              required: string[];
              properties: Record<string, { type: string }>;
            };
            description: string;
          };
          messages: Array<{
            type: string;
            content: string;
          }>;
        }>;
      };
    };
    toolCalls: ToolCall[];
  };
} 