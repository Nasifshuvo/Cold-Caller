import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server';
import { BookingAppointmentArgs, VapiToolCallPayload } from '@/types/vapi';

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json() as VapiToolCallPayload;
    
    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'vapi_full_log',
        description: JSON.stringify(body),
        callId: body.message.call.id
      }
    });

    // Extract appointment details from the tool call
    if(body.message.type === 'tool_call') {
      const toolCall = body.message.toolCalls[0];
      if (toolCall?.type !== 'function' || toolCall.function.name !== 'bookAppointment') {
        throw new Error('Invalid tool call data');
      }

      try {
        const args = toolCall.function.arguments as BookingAppointmentArgs;
        // Create the appointment
        const appointment = await prisma.appointment.create({
          data: {
            name: args.name,
            email: args.email,
            date: args.date,
            time: args.time,
            callId: body.message.call.id,
            metadata: {
              originalRequest: JSON.stringify(body),
              toolCallId: toolCall.id
            }
          }
        });

        // Log successful appointment creation
        await prisma.log.create({
          data: {
            event: 'appointment_created',
            description: {
              appointmentId: appointment.id,
              name: args.name,
              email: args.email,
              date: args.date,
              time: args.time
            }
          }
        });
      } catch (appointmentError) {
        // Log appointment creation error
        await prisma.log.create({
          data: {
            event: 'appointment_creation_failed',
            description: JSON.stringify({
              error: appointmentError instanceof Error ? appointmentError.message : 'Unknown error',
              callId: body.message.call.id
            })
          }
        });
        throw appointmentError;
      }
    }

    // Return response in Vapi's expected format
    return NextResponse.json({
      results: [{
        toolCallId: body.message.toolCalls[0].id,
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