import { Call as VapiCall } from './types';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCallRateMultiplier } from '@/utils/getSettings';
import { getVapiConfig } from '@/lib/vapi';

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
          startedAt: new Date(vapiCall.startedAt),
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

      // If final_cost exists and hasn't been deducted
      if (call.final_cost && !call.costDeducted) {
        // Create debit transaction
        const transaction = await tx.transaction.create({
          data: {
            clientId: existingCall.clientId,
            amount: call.final_cost,
            type: 'DEBIT',
            reason: `Call charge for call ID: ${call.id}`,
            reference: call.id.toString(),
            processed: false
          }
        });

        // Update client balance
        await tx.client.update({
          where: { id: existingCall.clientId },
          data: {
            balance: {
              decrement: call.final_cost
            }
          }
        });

        // Mark transaction as processed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { processed: true }
        });

        // Mark call as cost deducted
        return await tx.call.update({
          where: { id: call.id },
          data: { costDeducted: true }
        });
      }

      return call;
    });

    return result;

  } catch (error) {
    console.error(`Failed to sync call ${vapiCallId}:`, error);
    throw error;
  }
} 