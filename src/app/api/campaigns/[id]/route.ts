import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { LeadsData } from '@/types/leadsData';

// GET /api/campaigns/[id] - Get campaign details
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get campaign with leads
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: parseInt(id),
        clientId: user.client.id,
      },
      include: {
        leads: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
}

// PATCH /api/campaigns/[id] - Update campaign
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientId = user.client.id;  // Store client ID to avoid null checks

    // Get existing campaign
    const existingCampaign = await prisma.campaign.findUnique({
      where: {
        id: parseInt(id),
        clientId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existingCampaign.status !== 'Draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be edited' }, { status: 400 });
    }

    const body = await request.json();
    const { name, totalLeads, leads, estimatedCost } = body;

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: {
        id: parseInt(id),
        clientId,
      },
      data: {
        name,
        totalLeads,
        estimatedCost: new Prisma.Decimal(estimatedCost || 0),
      },
    });

    // Update leads if provided
    if (leads && leads.length > 0) {
      // Delete existing leads
      await prisma.lead.deleteMany({
        where: {
          campaignId: campaign.id
        }
      });

      // Create new leads
      await prisma.lead.createMany({
        data: leads.map((lead: LeadsData) => ({
          clientId,
          phoneNumber: lead.phoneNumber,
          name: lead.name || null,
          callStatus: 'Not Initiated',
          campaignId: campaign.id
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({ 
      message: 'Campaign updated successfully',
      campaign 
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
} 