import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.message.type;

    if (type === "end-of-call-report") {
      const callId = body.message.call.id;
      
      // Convert complex objects to JSON format
      const messagesJson = JSON.parse(JSON.stringify(body.message.artifact.messages)) as Prisma.InputJsonValue;
      const costBreakdownJson = JSON.parse(JSON.stringify(body.message.costBreakdown)) as Prisma.InputJsonValue;
      const analysisJson = JSON.parse(JSON.stringify(body.message.analysis)) as Prisma.InputJsonValue;
      
      // Convert cost to Decimal
      const cost = body.message.cost ? new Prisma.Decimal(body.message.cost) : null;
      const final_cost = body.message.cost ? new Prisma.Decimal(body.message.cost * 1.3) : null; // 30% markup

      // Update or create call record
      await prisma.call.upsert({
        where: {
          vapiCallId: callId
        },
        create: {
          vapiCallId: callId,
          type: body.message.call.type,
          callStatus: body.message.call.status,
          transcript: body.message.artifact.transcript,
          recordingUrl: body.message.artifact.recordingUrl,
          stereoRecordingUrl: body.message.artifact.stereoRecordingUrl,
          summary: body.message.analysis?.summary,
          cost,
          final_cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          assistantId: body.message.call.assistant?.id,
          customerNumber: body.message.call.customer?.number,
          webCallUrl: body.message.call.webCallUrl,
          startedAt: new Date(body.message.startedAt),
          endedAt: body.message.endedAt ? new Date(body.message.endedAt) : null,
          endedReason: body.message.endedReason,
          clientId: 1, // Default client ID since we don't have it in the webhook
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          callStatus: body.message.call.status,
          transcript: body.message.artifact.transcript,
          recordingUrl: body.message.artifact.recordingUrl,
          stereoRecordingUrl: body.message.artifact.stereoRecordingUrl,
          summary: body.message.analysis?.summary,
          cost,
          final_cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          endedAt: body.message.endedAt ? new Date(body.message.endedAt) : null,
          endedReason: body.message.endedReason,
          updatedAt: new Date(),
        }
      });
    }
    
    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'vapi_full_log',
        description: JSON.stringify(body),
        vapiCallId: body.message.call.id
      }
    });
    console.log("Vapi Called a POST Req")


    // Return response in Vapi's expected format
    return NextResponse.json({
      results: [{
        toolCallId: body.message.call.id,
        result: "Call report processed successfully"
      }]
    });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    
    // Log the error
    await prisma.log.create({
      data: {
        event: 'vapi_error',
        description: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 