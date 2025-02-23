import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const campaign_id = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get campaign with leads and calls
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaign_id,
        clientId: user.client.id,
      },
      include: {
        leads: {
          include: {
            calls: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Prepare data for export
    const reportData = campaign.leads.map(lead => {
      const call = lead.calls[0]; // Get the first call for this lead
      return {
        'Phone Number': lead.phoneNumber,
        'Name': lead.name || 'N/A',
        'Call Status': lead.callStatus,
        'Started At': call?.createdAt ? new Date(call.createdAt).toLocaleString() : 'N/A',
        'Ended At': call?.endedAt ? new Date(call.endedAt).toLocaleString() : 'N/A',
        'Duration (seconds)': call?.endedAt && call?.createdAt 
          ? Math.round((new Date(call.endedAt).getTime() - new Date(call.createdAt).getTime()) / 1000) 
          : 'N/A',
        'Cost': call?.cost ? `$${call.cost.toFixed(2)}` : 'N/A',
        'Response': call?.response || call?.endedReason || 'N/A',
        'Transcript': call?.transcript || 'N/A'
      };
    });

    // Create campaign summary sheet data
    const summaryData = [{
      'Campaign Name': campaign.name,
      'Status': campaign.status,
      'Total Leads': campaign.totalLeads,
      'Processed Leads': campaign.processedLeads,
      'Estimated Cost': `$${campaign.estimatedCost.toString()}`,
      'Actual Cost': `$${campaign.actualCost.toString()}`,
      'Created At': new Date(campaign.createdAt).toLocaleString(),
      'Updated At': new Date(campaign.updatedAt).toLocaleString()
    }];

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Add campaign summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Campaign Summary');
    
    // Add calls detail sheet
    const callsWs = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, callsWs, 'Call Details');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="campaign-${campaign.id}-report.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting campaign:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
} 