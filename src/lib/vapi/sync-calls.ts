import { Call as VapiCall } from './types';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function syncVapiCalls(vapiCalls: VapiCall[], clientId: number) {
  const results = await Promise.allSettled(
    vapiCalls.map(async (vapiCall) => {
      try {
        // Check if call already exists
        const existingCall = await prisma.call.findUnique({
          where: { vapiCallId: vapiCall.id },
          include: { lead: true }
        });

        if (existingCall) {
          // Update existing call with latest data
          return await prisma.call.update({
            where: { id: existingCall.id },
            data: {
              callStatus: vapiCall.status,
              type: vapiCall.type,
              startedAt: vapiCall.startedAt ? new Date(vapiCall.startedAt) : null,
              endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
              transcript: vapiCall.transcript,
              recordingUrl: vapiCall.recordingUrl,
              stereoRecordingUrl: vapiCall.stereoRecordingUrl,
              summary: vapiCall.summary,
              cost: vapiCall.cost ? new Prisma.Decimal(vapiCall.cost) : null,
              final_cost: vapiCall.cost ? new Prisma.Decimal(vapiCall.cost * 1.3) : null, // Example: 30% markup
              customerNumber: vapiCall.customer?.number,
              endedReason: vapiCall.endedReason,
              webCallUrl: vapiCall.webCallUrl,
              costBreakdown: vapiCall.costBreakdown,
              analysis: vapiCall.analysis,
              messages: vapiCall.messages,
              updatedAt: new Date(),
            }
          });
        }

        // Find or create lead based on customer number
        let lead = null;
        if (vapiCall.customer?.number) {
          lead = await prisma.lead.findUnique({
            where: {
              clientId_phoneNumber: {
                clientId,
                phoneNumber: vapiCall.customer.number,
              }
            }
          });

          if (!lead) {
            lead = await prisma.lead.create({
              data: {
                clientId,
                phoneNumber: vapiCall.customer.number,
                callStatus: vapiCall.status,
              }
            });
          }
        }

        // Create new call record
        return await prisma.call.create({
          data: {
            clientId,
            leadId: lead?.id ?? 0, // You might want to handle this differently
            vapiCallId: vapiCall.id,
            assistantId: vapiCall.assistantId,
            callStatus: vapiCall.status,
            type: vapiCall.type,
            startedAt: vapiCall.startedAt ? new Date(vapiCall.startedAt) : null,
            endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
            transcript: vapiCall.transcript,
            recordingUrl: vapiCall.recordingUrl,
            stereoRecordingUrl: vapiCall.stereoRecordingUrl,
            summary: vapiCall.summary,
            cost: vapiCall.cost ? new Prisma.Decimal(vapiCall.cost) : null,
            final_cost: vapiCall.cost ? new Prisma.Decimal(vapiCall.cost * 1.3) : null, // Example: 30% markup
            customerNumber: vapiCall.customer?.number,
            endedReason: vapiCall.endedReason,
            webCallUrl: vapiCall.webCallUrl,
            costBreakdown: vapiCall.costBreakdown,
            analysis: vapiCall.analysis,
            messages: vapiCall.messages,
          }
        });
      } catch (error) {
        console.error(`Failed to sync call ${vapiCall.id}:`, error);
        throw error;
      }
    })
  );

  // Return results of the sync operation
  return results.map((result, index) => ({
    vapiCallId: vapiCalls[index].id,
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : null,
  }));
} 