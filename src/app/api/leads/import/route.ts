import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

interface CsvRecord {
  phoneNumber: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // At this point, we know user.client exists
    const clientId = user.client.id;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as CsvRecord[];

    if (records.length === 0) {
      return NextResponse.json({ error: 'No records found in the file' }, { status: 400 });
    }

    // Create lead import record
    const leadImport = await prisma.leadImport.create({
      data: {
        clientId,
        fileName: file.name,
        totalLeads: records.length,
      }
    });

    // Create leads
    const leads = await Promise.all(
      records.map(async (record) => {
        const phoneNumber = record.phoneNumber?.toString().trim() || '';
        return prisma.lead.upsert({
          where: {
            clientId_phoneNumber: {
              clientId,
              phoneNumber: phoneNumber
            }
          },
          create: {
            clientId,
            importId: leadImport.id,
            phoneNumber: phoneNumber,
            callStatus: "Not Initiated"
          },
          update: {
            importId: leadImport.id
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      data: leads,
      message: `Successfully processed ${leads.length} leads`
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
} 