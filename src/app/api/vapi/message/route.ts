import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server';
import { BookingAppointmentArgs, VapiToolCallPayload } from '@/types/vapi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
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