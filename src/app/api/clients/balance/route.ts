import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true }
    });

    return NextResponse.json({ minutes: user?.client?.balanceInSeconds || 0 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch minutes' }, { status: 500 });
  }
}