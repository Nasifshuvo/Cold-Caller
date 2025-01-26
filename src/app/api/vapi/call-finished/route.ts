import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'
import { VapiToolCallPayload } from '@/types/vapi';

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json() as VapiToolCallPayload;
    
    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'call_finished',
        description: JSON.stringify(body),
        callId: body.message.call.id
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Call finished log created"
    });

  } catch (error) {
    console.error('Call finished webhook error:', error);
    
    // Log the error
    await prisma.log.create({
      data: {
        event: 'call_finished_error',
        description: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 