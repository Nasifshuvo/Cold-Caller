import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        user: {
          select: {
            email: true,
            active: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('GET clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.name || !body.phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          roleId: 2,
          active: true
        }
      });

      const client = await tx.client.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          userId: user.id
        },
        include: {
          user: {
            select: {
              email: true,
              active: true
            }
          }
        }
      });

      return client;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('POST client error:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
} 