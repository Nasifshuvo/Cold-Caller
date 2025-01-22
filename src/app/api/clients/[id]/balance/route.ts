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
    console.log('Request body:', body);

    const amount = parseFloat(body.amount);
    console.log('Parsed amount:', amount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    console.log('Client ID:', clientId);

    const result = await prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      const transaction = await prisma.transaction.create({
        data: {
          amount: amount,
          type: 'CREDIT',
          clientId: clientId,
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
