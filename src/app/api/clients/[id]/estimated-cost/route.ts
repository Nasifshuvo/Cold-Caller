import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
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


    const client = await prisma.client.update({
      where: { id: clientId },
      data: { 
        estimatedMinutesPerCall: body.estimatedMinutesPerCall,
      },
    });
    console.log("Client updated", client);

    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to update estimated duration:', error);
    return NextResponse.json(
      { error: 'Failed to update estimated call duration' }, 
      { status: 500 }
    );
  }
} 