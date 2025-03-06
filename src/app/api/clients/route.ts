import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ClientData {
  name: string;
  email: string;
  password: string;
  phone: string;
  balanceInSeconds?: number;
  vapiKey?: string | null;
  vapiAssistantId?: string | null;
  vapiPhoneNumberId?: string | null;
}

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

    return NextResponse.json({ data: clients });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: ClientData = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }
    
    // Validate required fields
    if (!data.email || !data.password || !data.name || !data.phone) {
      return NextResponse.json({ 
        error: 'Required fields missing: email, password, name, and phone are required' 
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          roleId: 2,
          active: true
        }
      });

      const client = await tx.client.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          userId: user.id,
          balanceInSeconds: data.balanceInSeconds || 0,
          vapiKey: data.vapiKey || null,
          vapiAssistantId: data.vapiAssistantId || null,
          vapiPhoneNumberId: data.vapiPhoneNumberId || null,
          active: true
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
    // Log the error for debugging
    console.error('POST client error:', error instanceof Error ? error.message : error);
    
    // Handle unique constraint violation
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ 
        error: 'Email already exists'
      }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json({ 
      error: 'Failed to create client',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 