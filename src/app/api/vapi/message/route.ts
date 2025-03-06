import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  console.log('=== VAPI Webhook Request Started ===');
  try {
    // Log raw request details
    // console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Get and log the raw body
    const rawBody = await request.text();
    // console.log('Raw request body:', rawBody);
    
    // Try parsing the body
    let body;
    try {
      body = JSON.parse(rawBody);
      // console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new NextResponse('Invalid JSON', { status: 400 });
    }

    // Validate body structure
    if (!body || typeof body !== 'object') {
      console.error('Invalid body structure. Received:', body);
      return new NextResponse('Invalid request body structure', { status: 400 });
    }

    // Type check for required fields
    if (!body.message?.call?.id) {
      console.error('Missing required fields. Body structure:', {
        hasMessage: !!body.message,
        hasCall: !!body.message?.call,
        callId: body.message?.call?.id
      });
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const type = body.message.type;
    console.log('Webhook type:', type);

    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'vapi_full_log',
        description: JSON.stringify(body),
        vapiCallId: body.message.call.id
      }
    });
    console.log("Vapi Called a POST Req")

    if(type === "status-update"){
      // Update the call record with the status from body.message.status
      await prisma.call.update({
        where: { vapiCallId: body.message.call.id },
        data: { callStatus: body.message.status }
      });
    }else if(type === "end-of-call-report") {
      const callId = body.message.call.id;

      //get client from Call table where vapiCallId equals callId
      const client = await prisma.call.findUnique({
        where: { vapiCallId: callId },
        select: {
          client: true
        }
      });

      // Convert complex objects to JSON format
      const messagesJson = JSON.parse(JSON.stringify(body.message.artifact.messages)) as Prisma.InputJsonValue;
      const costBreakdownJson = JSON.parse(JSON.stringify(body.message.costBreakdown)) as Prisma.InputJsonValue;
      const analysisJson = JSON.parse(JSON.stringify(body.message.analysis)) as Prisma.InputJsonValue;
      
      // Convert cost to Decimal
      const cost = body.message.cost ? new Prisma.Decimal(body.message.cost) : null;

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
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          assistantId: body.message.call.assistantId,
          webCallUrl: body.message.call.webCallUrl,
          startedAt: new Date(body.message.startedAt),
          endedAt: body.message.endedAt ? new Date(body.message.endedAt) : null,
          endedReason: body.message.endedReason,
          durationInSeconds: body.message.durationSeconds,
          clientId: 1, // Default client ID since we don't have it in the webhook
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          transcript: body.message.artifact.transcript,
          recordingUrl: body.message.artifact.recordingUrl,
          stereoRecordingUrl: body.message.artifact.stereoRecordingUrl,
          summary: body.message.analysis?.summary,
          cost,
          costBreakdown: costBreakdownJson,
          analysis: analysisJson,
          messages: messagesJson,
          endedAt: body.message.endedAt ? new Date(body.message.endedAt) : null,
          endedReason: body.message.endedReason,
          durationInSeconds: body.message.durationSeconds,
          updatedAt: new Date(),
        }
      });

      const final_duration_in_seconds = body.message.durationSeconds;

      // Transaction to update client balance
      if(final_duration_in_seconds && client){
        // First create the transaction record
        const transaction = await prisma.transaction.create({
          data: {
            seconds: new Prisma.Decimal(final_duration_in_seconds),
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
            data: {
              balanceInSeconds: {
                decrement: new Prisma.Decimal(final_duration_in_seconds)
              }
            }
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


    // Return response in Vapi's expected format
    return NextResponse.json({
      results: [{
        toolCallId: body.message.call.id,
        result: "Call report processed successfully"
      }]
    });
  } catch (error) {
    console.error('=== VAPI Webhook Error ===');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error // Full error object
    });
    
    // Log the error in a structured way
    try {
      await prisma.log.create({
        data: {
          event: 'vapi_webhook_error',
          description: JSON.stringify({
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : String(error),
            timestamp: new Date().toISOString()
          }),
          vapiCallId: null // since we might not have this in error case
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    console.log('=== VAPI Webhook Request Ended ===');
  }
} 