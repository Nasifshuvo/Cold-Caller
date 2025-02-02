import { Call as VapiCall } from './types';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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