import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const updatedClient = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        vapiKey: body.vapiKey,
        vapiAssistantId: body.vapiAssistantId,
        vapiPhoneNumberId: body.vapiPhoneNumberId
      }
    });

    return NextResponse.json({ data: updatedClient });
  } catch (error) {
    console.error('VAPI update failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update VAPI settings' 
    }, { 
      status: 500 
    });
  }
} 