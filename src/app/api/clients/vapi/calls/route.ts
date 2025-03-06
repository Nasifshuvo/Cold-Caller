import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch calls
export async function GET() {
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

    const calls = await prisma.call.findMany({
      where: {
        clientId: client.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST: Create new call with transaction
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const callData = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const call = await tx.call.create({
        data: {
          ...callData,
          costDeducted: false,
          durationInSeconds: callData.durationInSeconds || 0
        }
      });

      // If duration exists and hasn't been deducted
      if (call.durationInSeconds && !call.costDeducted) {
        // First check if client has sufficient balance
        const client = await tx.client.findUnique({
          where: { id: call.clientId },
          select: { balanceInSeconds: true }
        });

        if (!client || parseFloat(client.balanceInSeconds.toString()) < call.durationInSeconds) {
          throw new Error('Insufficient balance');
        }

        // Create debit transaction
        const transaction = await tx.transaction.create({
          data: {
            clientId: call.clientId,
            seconds: -call.durationInSeconds, // Negative for debit
            type: 'DEBIT',
            reason: `Call duration: ${call.durationInSeconds} seconds`,
            reference: call.id.toString(),
            processed: false // Set initially to false
          }
        });

        // Update client's balance by reducing it by the call duration
        await tx.client.update({
          where: { id: call.clientId },
          data: {
            balanceInSeconds: {
              decrement: call.durationInSeconds
            }
          }
        });

        // Mark transaction as processed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { processed: true }
        });

        // Mark call as cost deducted
        return await tx.call.update({
          where: { id: call.id },
          data: { costDeducted: true }
        });
      }

      return call;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create call:', error);
    if (error instanceof Error && error.message === 'Insufficient balance') {
      return new NextResponse('Insufficient balance', { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT: Update existing call
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, ...updateData } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const call = await tx.call.findUnique({
        where: { id }
      });

      if (!call) {
        throw new Error('Call not found');
      }

      // If updating duration and cost hasn't been deducted yet
      if (updateData.durationInSeconds && !call.costDeducted) {
        // First check if client has sufficient balance
        const client = await tx.client.findUnique({
          where: { id: call.clientId },
          select: { balanceInSeconds: true }
        });

        if (!client || parseFloat(client.balanceInSeconds.toString()) < updateData.durationInSeconds) {
          throw new Error('Insufficient balance');
        }

        // Create debit transaction
        const transaction = await tx.transaction.create({
          data: {
            clientId: call.clientId,
            seconds: -updateData.durationInSeconds, // Negative for debit
            type: 'DEBIT',
            reason: `Call duration: ${updateData.durationInSeconds} seconds`,
            reference: call.id.toString(),
            processed: false // Set initially to false
          }
        });

        // Update client's balance by reducing it by the call duration
        await tx.client.update({
          where: { id: call.clientId },
          data: {
            balanceInSeconds: {
              decrement: updateData.durationInSeconds
            }
          }
        });

        // Mark transaction as processed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { processed: true }
        });

        updateData.costDeducted = true;
      }

      return await tx.call.update({
        where: { id },
        data: updateData
      });
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Failed to update call:', error);
    if (error instanceof Error) {
      if (error.message === 'Call not found') {
        return new NextResponse('Call not found', { status: 404 });
      }
      if (error.message === 'Insufficient balance') {
        return new NextResponse('Insufficient balance', { status: 400 });
      }
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 