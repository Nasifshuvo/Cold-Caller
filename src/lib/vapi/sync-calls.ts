import { Call, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getVapiConfig } from '@/lib/vapi';
import { calculateDurationInSeconds } from '../utils/duration';
import { getCallRateMultiplier } from '@/utils/getSettings';

interface VapiCall {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  endedAt?: string;
  endedReason?: string;
  assistantId?: string;
  startedAt?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  webCallUrl?: string;
  customer?: {
    number?: string;
  };
  cost?: number;
  messages?: Array<{
    role: string;
    time: number;
    message: string;
    secondsFromStart: number;
    endTime?: number;
    duration?: number;
  }>;
  monitor?: {
    controlUrl?: string;
  };
  recording?: {
    url?: string;
    stereoUrl?: string;
  };
  transcript?: string;
  summary?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  costBreakdown?: {
    llm: number;
    stt: number;
    tts: number;
    vapi: number;
    total: number;
    ttsCharacters: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    analysisCostBreakdown?: {
      summary: number;
      structuredData: number;
      successEvaluation: number;
    };
  };
}

export async function syncVapiCalls(vapiCalls: VapiCall[]) {
  for (const vapiCall of vapiCalls) {
    try {
      // Convert messages array to a format Prisma can store as JSON
      const messagesJson = JSON.parse(JSON.stringify(vapiCall.messages)) as Prisma.InputJsonValue;
      const costBreakdownJson = JSON.parse(JSON.stringify(vapiCall.costBreakdown)) as Prisma.InputJsonValue;
      const analysisJson = JSON.parse(JSON.stringify(vapiCall.analysis)) as Prisma.InputJsonValue;

      // Convert cost to Decimal if present
      const cost = vapiCall.cost ? new Prisma.Decimal(vapiCall.cost) : null;
      const final_cost = vapiCall.cost ? new Prisma.Decimal(vapiCall.cost * 1.3) : null; // 30% markup

      await prisma.call.upsert({
        where: {
          vapiCallId: vapiCall.id
        },
        create: {
          vapiCallId: vapiCall.id,
          type: vapiCall.type,
          callStatus: vapiCall.status,
          startedAt: vapiCall.startedAt ? new Date(vapiCall.startedAt) : new Date(),
          endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
          transcript: vapiCall.transcript,
          recordingUrl: vapiCall.recordingUrl,
          stereoRecordingUrl: vapiCall.stereoRecordingUrl,
          summary: vapiCall.summary,
          cost,
          final_cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          assistantId: vapiCall.assistantId,
          customerNumber: vapiCall.customer?.number,
          endedReason: vapiCall.endedReason,
          webCallUrl: vapiCall.webCallUrl,
          clientId: 1, // You'll need to set this based on your logic
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          callStatus: vapiCall.status,
          endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
          transcript: vapiCall.transcript,
          recordingUrl: vapiCall.recordingUrl,
          stereoRecordingUrl: vapiCall.stereoRecordingUrl,
          summary: vapiCall.summary,
          cost,
          final_cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          endedReason: vapiCall.endedReason,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error(`Failed to sync call ${vapiCall.id}:`, error);
    }
  }
}

export async function syncSingleCall(vapiCallId: string) {
  try {
    // 1. Get call data from Vapi API
    const vapiConfig = getVapiConfig();
    const vapiCall = await vapiConfig.getCall(vapiCallId);

    // 2. Get rate multiplier (default to 2 if not found)
    const rateMultiplier = await getCallRateMultiplier() || 2;

    // 3. Convert complex objects to JSON format
    const messagesJson = JSON.parse(JSON.stringify(vapiCall.messages)) as Prisma.InputJsonValue;
    const costBreakdownJson = JSON.parse(JSON.stringify(vapiCall.costBreakdown)) as Prisma.InputJsonValue;
    const analysisJson = JSON.parse(JSON.stringify(vapiCall.analysis)) as Prisma.InputJsonValue;

    // 4. Convert cost to Decimal and calculate final cost
    const cost = vapiCall.cost ? new Prisma.Decimal(vapiCall.cost) : null;
    const final_cost = vapiCall.cost ? new Prisma.Decimal(vapiCall.cost * rateMultiplier) : null;

    // 5. Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // First get existing call to preserve clientId
      const existingCall = await tx.call.findUnique({
        where: { vapiCallId: vapiCall.id }
      });

      if (!existingCall) {
        throw new Error(`Call ${vapiCallId} not found in database`);
      }

      // Update call with new data
      const call = await tx.call.update({
        where: { vapiCallId: vapiCall.id },
        data: {
          callStatus: vapiCall.status,
          endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
          transcript: vapiCall.transcript,
          recordingUrl: vapiCall.recordingUrl,
          stereoRecordingUrl: vapiCall.stereoRecordingUrl,
          summary: vapiCall.summary,
          cost,
          final_cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          endedReason: vapiCall.endedReason,
          updatedAt: new Date()
        }
      });

      // If call has ended and duration hasn't been deducted
      if (call.endedAt && !call.costDeducted) {
        // Skip if startedAt is null
        if (!call.startedAt) {
          console.error(`Call ${call.id} has no start time`);
          return call;
        }

        // Calculate duration in seconds
        const durationInSeconds = calculateDurationInSeconds(
          new Date(call.startedAt),
          new Date(call.endedAt)
        );


        // Create debit transaction
        await tx.transaction.create({
          data: {
            clientId: existingCall.clientId,
            seconds: -durationInSeconds, // Negative for debit
            type: 'DEBIT',
            reason: `Call duration: ${durationInSeconds} seconds`,
            reference: call.id.toString(),
            processed: true
          }
        });

        // Update client minutes
        await tx.client.update({
          where: { id: existingCall.clientId },
          data: {
            balanceInSeconds: {
              decrement: durationInSeconds
            }
          }
        });

        // Mark call as processed
        await tx.call.update({
          where: { id: call.id },
          data: {
            costDeducted: true,
            durationInSeconds: durationInSeconds
          }
        });

        return call;
      }

      return call;
    });

    return result;

  } catch (error) {
    console.error(`Failed to sync call ${vapiCallId}:`, error);
    throw error;
  }
}

export async function syncCalls(calls: Call[]) {
  for (const call of calls) {
    try {
      // Skip if call hasn't ended or cost already deducted
      if (!call.endedAt || call.costDeducted) {
        continue;
      }

      // Skip if startedAt is null
      if (!call.startedAt) {
        console.error(`Call ${call.id} has no start time`);
        continue;
      }

      // Calculate duration in seconds
      const durationInSeconds = call.durationInSeconds;


      // Create transaction and update client balance in a transaction
      await prisma.$transaction(async (tx) => {
        // Create debit transaction
        await tx.transaction.create({
          data: {
            clientId: call.clientId,
            seconds: -(durationInSeconds ?? 0), // Negative for debit
            type: 'DEBIT',
            reason: `Call duration: ${durationInSeconds ?? 0} seconds`,
            reference: call.id.toString(),
            processed: true
          }
        });

        // Update client minutes
        await tx.client.update({
          where: { id: call.clientId },
          data: {
            balanceInSeconds: {
              decrement: durationInSeconds ?? 0
            }
          }
        });

        // Mark call as processed
        await tx.call.update({
          where: { id: call.id },
          data: {
            costDeducted: true,
            durationInSeconds: durationInSeconds
          }
        });
      });
    } catch (error) {
      console.error(`Failed to process call ${call.id}:`, error);
    }
  }
}

// Update the call record with VAPI data
export const updateCall = async (call: Call, vapiCall: VapiCall) => {
  // Handle dates with proper type checks
  let startedAt: Date | null = null;
  let endedAt: Date | null = null;

  try {
    if (vapiCall.startedAt) {
      startedAt = new Date(vapiCall.startedAt);
    }
    if (vapiCall.endedAt) {
      endedAt = new Date(vapiCall.endedAt);
    }
  } catch (error) {
    console.error('Error parsing dates:', error);
  }

  // Calculate duration and minutes if the call has ended
  let durationInSeconds = 0;
  
  if (startedAt && endedAt) {
    durationInSeconds = calculateDurationInSeconds(startedAt, endedAt);
  }

  // Update call record
  await prisma.call.update({
    where: { id: call.id },
    data: {
      callStatus: vapiCall.status,
      startedAt,
      endedAt,
      endedReason: vapiCall.endedReason || null,
      transcript: vapiCall.transcript || null,
      summary: vapiCall.summary || null,
      analysis: vapiCall.analysis ? Prisma.JsonNull : undefined,
      costBreakdown: vapiCall.costBreakdown ? Prisma.JsonNull : undefined,
      recordingUrl: vapiCall.recordingUrl || null,
      stereoRecordingUrl: vapiCall.stereoRecordingUrl || null,
      webCallUrl: vapiCall.webCallUrl || null,
      durationInSeconds
    }
  });
}; 