import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { POST as createCall, PUT as updateCall } from '../calls/route';

// Helper function to create Request object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRequestObject(method: string, body: any) {
  return new Request('http://localhost', {  // Using localhost as base URL
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the client first
    const client = await prisma.client.findFirst({
      where: {
        userId: parseInt(session.user.id)
      }
    });

    if (!client) {
      return new NextResponse('Client not found', { status: 404 });
    }

    const vapiCalls = await request.json();
    console.log('Starting sync for calls:', vapiCalls.length);
    
    for (const vapiCall of vapiCalls) {
      try {
        console.log('Processing call:', vapiCall.id);
        
        const existingCall = await prisma.call.findUnique({
          where: { vapiCallId: vapiCall.id }
        });

        if (existingCall) {
          console.log('Call already exists:', vapiCall.id);
          
          await updateCall(createRequestObject('PUT', {
            id: existingCall.id,
            type: vapiCall.type,
            callStatus: vapiCall.status || 'Not Initiated',
            startedAt: new Date(vapiCall.startedAt),
            endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
            transcript: vapiCall.transcript || '',
            recordingUrl: vapiCall.recordingUrl || '',
            summary: vapiCall.summary || '',
            customerNumber: vapiCall.customer?.number || '',
            endedReason: vapiCall.endedReason || '',
            stereoRecordingUrl: vapiCall.stereoRecordingUrl || '',
            cost: vapiCall.cost || 0,
            costBreakdown: vapiCall.costBreakdown || {},
            analysis: vapiCall.analysis || {},
            messages: vapiCall.messages || {},
            assistantId: vapiCall.assistantId
          }));
          
        } else {
          await createCall(createRequestObject('POST', {
            vapiCallId: vapiCall.id,
            clientId: client.id,
            type: vapiCall.type,
            callStatus: vapiCall.status || 'Not Initiated',
            startedAt: new Date(vapiCall.startedAt),
            endedAt: vapiCall.endedAt ? new Date(vapiCall.endedAt) : null,
            transcript: vapiCall.transcript || '',
            recordingUrl: vapiCall.recordingUrl || '',
            summary: vapiCall.summary || '',
            customerNumber: vapiCall.customer?.number || '',
            endedReason: vapiCall.endedReason || '',
            stereoRecordingUrl: vapiCall.stereoRecordingUrl || '',
            cost: vapiCall.cost || 0,
            costBreakdown: vapiCall.costBreakdown || {},
            analysis: vapiCall.analysis || {},
            messages: vapiCall.messages || {},
            assistantId: vapiCall.assistantId
          }));
        }
      } catch (error) {
        console.error('Error processing call:', vapiCall.id, error);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync calls:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 