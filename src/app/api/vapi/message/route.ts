import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { VapiMessage } from '@/types/vapi-post-response';
export async function POST(request: Request) {
  try {
    const body: VapiMessage = await request.json();
    const type = body.message.type;

    if(type === "status-update"){
      if(body.message.status === "in-progress"){
        // Update the call record to in progress
        await prisma.call.update({
          where: { vapiCallId: body.message.call.id },
          data: { callStatus: "in-progress" }
        });
      }else if(body.message.status === "ended"){
        // Update the call record to ended
        await prisma.call.update({
          where: { vapiCallId: body.message.call.id },
          data: { callStatus: "ended" }
        });
      }

    }else if(type === "end-of-call-report") {
      const callId = body.message.call.id;

      //get client from Call table where vapiCallId equals callId
      const client = await prisma.call.findUnique({
        where: { vapiCallId: callId },
        select: {
          client: true
        }
      });

      //Get call_rate_multiplier from Settings table where key is "call_rate_multiplier"
      const callRateMultiplier = await prisma.setting.findUnique({
        where: { key: "call_rate_multiplier" },
        select: {
          value: true
        }
      });
      
      // Parse the JSON value and extract the multiplier
      const multiplier = callRateMultiplier ? JSON.parse(callRateMultiplier.value as string).multiplier : 2;
      
      // Convert complex objects to JSON format
      const messagesJson = JSON.parse(JSON.stringify(body.message.artifact.messages)) as Prisma.InputJsonValue;
      const costBreakdownJson = JSON.parse(JSON.stringify(body.message.costBreakdown)) as Prisma.InputJsonValue;
      const analysisJson = JSON.parse(JSON.stringify(body.message.analysis)) as Prisma.InputJsonValue;
      
      // Convert cost to Decimal
      const cost = body.message.cost ? new Prisma.Decimal(body.message.cost) : null;
      const final_cost = body.message.cost ? new Prisma.Decimal(body.message.cost * multiplier) : null; // Using dynamic multiplier

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
          assistantId: body.message.call.assistantId,
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

      // Transaction to update client balance
      if(final_cost && client){
        // First create the transaction record
        const transaction = await prisma.transaction.create({
          data: {
            amount: final_cost,
            type: "DEBIT",
            clientId: client.client.id,
            reason: "Call Cost",
            reference: callId,
            processed: false // Initially set to false
          }
        });

        try {
          // Try to update client balance
          await prisma.client.update({
            where: { id: client.client.id },
            data: { balance: { decrement: final_cost } }
          });

          // If balance update succeeds, mark both transaction and call as processed
          await Promise.all([
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { processed: true }
            }),
            prisma.call.update({
              where: { vapiCallId: callId },
              data: { costDeducted: true, updatedAt: new Date() }
            })
          ]);
        } catch (error) {
          // If balance update fails, log the error but don't mark as processed
          console.error('Failed to process transaction:', error);
          await prisma.log.create({
            data: {
              event: 'transaction_error',
              description: JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Unknown error',
                transactionId: transaction.id,
                callId
              })
            }
          });
        }
      }
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