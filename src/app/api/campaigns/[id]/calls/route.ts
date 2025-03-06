import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Validate and parse the ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const campaignId = parseInt(id);

    // Get campaign calls
    const calls = await prisma.call.findMany({
      where: {
        campaignId: campaignId,
        clientId: user.client.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching campaign calls:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
} 