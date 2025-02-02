import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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