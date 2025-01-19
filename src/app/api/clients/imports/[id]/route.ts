import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const importDetails = await prisma.leadImport.findUnique({
      where: {
        id: parseInt(params.id)
      },
      include: {
        leads: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!importDetails) {
      return NextResponse.json({ error: 'Import not found' }, { status: 404 });
    }

    return NextResponse.json(importDetails);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch import details' },
      { status: 500 }
    );
  }
} 