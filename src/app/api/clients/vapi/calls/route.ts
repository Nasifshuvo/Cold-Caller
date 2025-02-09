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
          costDeducted: false
        }
      });

      // If final_cost exists and hasn't been deducted
      if (call.final_cost && !call.costDeducted) {
        // Create debit transaction
        const transaction = await tx.transaction.create({
          data: {
            clientId: call.clientId,
            amount: call.final_cost,
            type: 'DEBIT',
            reason: `Call charge for call ID: ${call.id}`,
            reference: call.id.toString(),
            processed: false // Set initially to false
          }
        });

        // Update client balance
        await tx.client.update({
          where: { id: call.clientId },
          data: {
            balance: {
              decrement: call.final_cost
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

      // If updating cost and cost hasn't been deducted yet
      if (updateData.final_cost && !call.costDeducted) {
        // Create debit transaction
        await tx.transaction.create({
          data: {
            clientId: call.clientId,
            amount: updateData.final_cost,
            type: 'DEBIT',
            reason: `Call charge for call ID: ${call.id}`,
            processed: true
          }
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
    if (error instanceof Error && error.message === 'Call not found') {
      return new NextResponse('Call not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 