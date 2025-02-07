import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const setting = await prisma.setting.upsert({
      where: {
        key: data.key,
      },
      update: {
        value: data.value,
        category: data.category,
        label: data.label,
        description: data.description,
      },
      create: {
        key: data.key,
        value: data.value,
        category: data.category,
        label: data.label,
        description: data.description,
        isSystem: true,
      },
    });
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
} 