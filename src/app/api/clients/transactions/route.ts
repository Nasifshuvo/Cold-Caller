import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true }
    });

    console.log('Found user:', user?.id);
    console.log('Client ID:', user?.client?.id);

    if (!user?.client) {
      console.log('No client found for user');
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { 
        clientId: user.client.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    console.log('Found transactions:', transactions.length);
    return NextResponse.json(transactions);

  } catch (error) {
    console.error('GET transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 