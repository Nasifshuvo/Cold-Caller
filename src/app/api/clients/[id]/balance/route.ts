import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const clientId = parseInt(id);
    const body = await request.json();
    
    const minutes = parseInt(body.amount);
    if (!minutes || minutes <= 0) {
      return NextResponse.json({ error: 'Invalid minutes amount' }, { status: 400 });
    }

    // Convert minutes to seconds
    const seconds = minutes * 60;

    const result = await prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const transaction = await prisma.transaction.create({
        data: {
          seconds: seconds,
          type: 'CREDIT',
          clientId: clientId,
          reason: 'Minutes added by admin',
          reference: `Balance added by admin: ${minutes} minutes`
        }
      });

      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          balanceInSeconds: {
            increment: seconds,
          },
        },
      });

      return {
        client: updatedClient,
        transaction: transaction,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Balance update failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add balance' },
      { status: 500 }
    );
  }
}
