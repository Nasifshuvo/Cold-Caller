import { NextResponse } from 'next/server';
import { createLeadsFromImport } from '@/lib/utils/leads';
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body); // Debug log

    const { clientId, fileName, leads } = body;
    
    // Validate the data
    if (!clientId || !fileName || !leads) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createLeadsFromImport(clientId, fileName, leads);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Failed to create leads' }, { status: 500 });
  }
} 