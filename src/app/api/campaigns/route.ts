import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { LeadsData } from '@/types/leadsData';

// Add query logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  
  return result;
});

// GET /api/campaigns - Get all campaigns for the current client
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { clientId: user.client.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: Request) {
  try {
    console.log('Starting campaign creation...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true },
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientId = user.client.id;

    const body = await request.json();
    const { name, type, status, totalLeads, leads, estimatedSeconds } = body;

    if (!name || !type || !leads) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: name, type, and leads are required' 
      }, { status: 400 });
    }

    console.log('Request body:', body);

    // Create campaign first
    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        status: status || 'Draft',
        totalLeads: totalLeads || leads.length,
        processedLeads: 0,
        estimatedSeconds: new Prisma.Decimal(estimatedSeconds || 0),
        actualSeconds: new Prisma.Decimal(0),
        clientId,
      },
    });

    console.log('Campaign created:', campaign);

    // Create or update leads and their calls
    if (leads && leads.length > 0) {
      console.log('Processing leads...');
      
      // First, check for existing leads
      const existingLeads = await prisma.lead.findMany({
        where: {
          clientId,
          phoneNumber: {
            in: leads.map((lead: LeadsData) => lead.phoneNumber)
          }
        }
      });

      console.log('Existing leads found:', existingLeads.length);
      
      // Create a map of phone numbers to existing leads
      const phoneToLeadMap = new Map(existingLeads.map(lead => [lead.phoneNumber, lead]));

      // Update existing leads
      const updatedLeads = await Promise.all(existingLeads.map(async lead => {
        return prisma.lead.update({
          where: { id: lead.id },
          data: {
            campaignId: campaign.id,
            callStatus: 'Not Initiated'
          }
        });
      }));

      // Create new leads
      const newLeadsData = leads.filter((lead: LeadsData) => !phoneToLeadMap.has(lead.phoneNumber));
      console.log('New leads to create:', newLeadsData.length);
      
      const createdLeads = await Promise.all(newLeadsData.map(async (lead: LeadsData) => {
        return prisma.lead.create({
          data: {
            clientId,
            phoneNumber: lead.phoneNumber,
            callStatus: 'Not Initiated',
            campaignId: campaign.id
          }
        });
      }));

      // Combine all leads
      const allLeads = [...updatedLeads, ...createdLeads];
      console.log('Total leads processed:', allLeads.length);

      // Create calls for all leads
      if (allLeads.length > 0) {
        const callsData = allLeads.map(lead => ({
          clientId: clientId,
          callStatus: 'Pending',
          customerNumber: lead.phoneNumber,
          type: 'outboundPhoneCall',
          campaignId: campaign.id,
          leadId: lead.id
        }));

        const createdCalls = await prisma.call.createMany({
          data: callsData
        });

        console.log(`Successfully created ${createdCalls.count} calls`);
      }
    }

    // Return the created campaign with additional info
    const campaignResponse = {
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        totalLeads: campaign.totalLeads,
        processedLeads: campaign.processedLeads,
        estimatedSeconds: campaign.estimatedSeconds.toString(),
        actualSeconds: campaign.actualSeconds.toString(),
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        clientId: campaign.clientId
      },
      message: 'Campaign created successfully'
    };

    return NextResponse.json(campaignResponse);
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        success: false,
        error: `Database error: ${error.message}` 
      }, { 
        status: 400 
      });
    }

    // Handle other errors
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    });
  }
} 