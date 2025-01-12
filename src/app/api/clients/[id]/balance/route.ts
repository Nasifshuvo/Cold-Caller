import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { use } from 'react';
import { PrismaClient } from '@prisma/client';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const amount = parseFloat(body.amount);
    console.log('Parsed amount:', amount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const clientId = parseInt(context.params.id);
    console.log('Client ID:', clientId);

    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      const client = await tx.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          amount: amount,
          type: 'CREDIT',
          clientId: clientId
        }
      });

      return {
        client: updatedClient,
        transaction: transaction
      };
    });

    return NextResponse.json({ data: result });

  } catch (error) {
    console.error('Balance update failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to add balance' 
    }, { 
      status: 500 
    });
  }
} 