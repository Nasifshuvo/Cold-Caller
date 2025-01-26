import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server';
import { BookingAppointmentArgs, VapiToolCallPayload } from '@/types/vapi';

export async function POST(request: Request) {
  try {
    const body = await request.json() as VapiToolCallPayload;
    
    // Store the entire request in logs
    await prisma.log.create({
      data: {
        event: 'vapi_full_log',
        description: JSON.stringify(body),
        vapiCallId: body.message.call.id
      }
    });

    // Extract appointment details from the tool call
    if(body.message.type === 'tool-calls') {
      console.log('Tool call found');
      const toolCall = body.message?.tool_calls?.[0];
      console.log('Tool call', toolCall);
      console.log('Tool call type', toolCall?.type);
      console.log('Tool call name', toolCall?.function?.name);
      if (toolCall?.type !== 'function' || toolCall.function.name !== 'bookAppointment') {
        throw new Error('Invalid tool call data');
      }

      try {
        console.log('Tool call arguments', toolCall.function.arguments);
        const args = toolCall.function.arguments as BookingAppointmentArgs;
        // Validate input data
        if (!args.date || !args.name || !args.time || !args.email) {
          console.error('Missing required fields:', { args });
          throw new Error('Missing required appointment fields');
        }

        // Log the exact structure being passed to Prisma
        const appointmentData = {
          name: args.name,
          email: args.email,
          date: args.date,
          time: args.time,
          vapiCallId: body.message.call.id,
          metadata: {
            // originalRequest: JSON.stringify(body),
            toolCallId: toolCall.id
          }
        };
        
        console.log('Appointment data being passed to Prisma:', JSON.stringify(appointmentData, null, 2));

        const appointment = await prisma.appointment.create({
          data: appointmentData
        });
        
        console.log('Appointment created successfully:', appointment);

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

        // Return response in Vapi's expected format with detailed message
        // return NextResponse.json({
        //   results: [{
        //     toolCallId: body.message.tool_calls[0].id,
        //     result: `Appointment is successfully booked.`
        //   }]
        // });
        return NextResponse.json({
            "role": "assistant",
            "type": "request-complete",
            "content": "Appointment is successfully booked."
        });
      } catch (error) {
        console.error('Detailed error information:', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // @ts-expect-error - Prisma error type may include code property
            code: error.code
          } : error,
          inputData: toolCall.function.arguments,
          callId: body.message.call.id,
          toolCallId: toolCall?.id
        });
        throw error;
      }
    }else{
      console.log('No tool call found');
    }

    // Return response in Vapi's expected format
    return NextResponse.json({
      results: [{
        toolCallId: body.message.tool_calls[0].id,
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