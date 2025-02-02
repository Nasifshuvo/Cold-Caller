import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
        
        // Check if call already exists
        const existingCall = await prisma.call.findUnique({
          where: { vapiCallId: vapiCall.id },
          include: { lead: true }
        });

        if (existingCall) {
          console.log('Call already exists:', vapiCall.id);
          continue;
        }

        // Create new call record
        const newCall = await prisma.call.create({
          data: {
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
          }
        });

        console.log('Created new call:', newCall.id);
      } catch (error) {
        console.error('Error processing call:', vapiCall.id, error);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync calls:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to sync calls', details: error }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 