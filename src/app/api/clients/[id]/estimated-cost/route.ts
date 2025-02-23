import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const client = await prisma.client.update({
      where: { id: parseInt(params.id) },
      data: { 
        estimatedCallCost: body.estimatedCallCost,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to update estimated cost:', error);
    return NextResponse.json(
      { error: 'Failed to update estimated cost' }, 
      { status: 500 }
    );
  }
} 