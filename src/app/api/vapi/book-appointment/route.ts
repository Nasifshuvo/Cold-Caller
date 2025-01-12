import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'vapi_book_appointment',
        description: body
      }
    });

    // Return response in Vapi's expected format
    return NextResponse.json({
      results: [{
        toolCallId: body.toolCallId,
        result: "Appointment request logged successfully"
      }]
    });

  } catch (error) {
    console.error('Vapi webhook error:', error);
    
    // Log the error
    await prisma.log.create({
      data: {
        event: 'vapi_error',
        description: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 