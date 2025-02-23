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
  
  console.log(`Prisma Query Details:`, {
    model: params.model,
    action: params.action,
    args: params.args,
    duration: `${after - before}ms`,
    query: params,
    timestamp: new Date().toISOString()
  });
  
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
    const { name, type, status, totalLeads, leads, estimatedCost } = body;

    console.log('Request body:', body);

    // Create campaign first
    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        status,
        totalLeads,
        estimatedCost: new Prisma.Decimal(estimatedCost || 0),
        clientId,
      },
    });

    console.log('Campaign created:', campaign);
    console.log('Leads data received:', leads);
    console.log('Leads array length:', leads?.length);

    // Create or update leads and their calls
    if (leads && leads.length > 0) {
      console.log('Processing leads...');
      
      // First, check for existing leads
      const existingLeads = await prisma.lead.findMany({
        where: {
          clientId,
          phoneNumber: {
            in: leads.map((lead: LeadsData) => {
              console.log('Processing lead:', lead);
              return lead.phoneNumber;
            })
          }
        }
      });

      console.log('Existing leads found:', existingLeads);
      
      // Create a map of phone numbers to existing leads
      const phoneToLeadMap = new Map(existingLeads.map(lead => [lead.phoneNumber, lead]));
      console.log('Phone to lead map:', Array.from(phoneToLeadMap.entries()));

      // Update existing leads and store updated leads
      const updatedLeads = await Promise.all(existingLeads.map(async lead => {
        const updatedLead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            campaignId: campaign.id,
            callStatus: 'Not Initiated'
          }
        });
        console.log('Updated lead:', updatedLead);
        return updatedLead;
      }));

      // Create new leads and store created leads
      const newLeadsData = leads.filter((lead: LeadsData) => !phoneToLeadMap.has(lead.phoneNumber));
      console.log('New leads to create:', newLeadsData);
      
      const createdLeads = await Promise.all(newLeadsData.map(async (lead: LeadsData) => {
        const newLead = await prisma.lead.create({
          data: {
            clientId,
            phoneNumber: lead.phoneNumber,
            name: lead.name || null,
            callStatus: 'Not Initiated',
            campaignId: campaign.id
          }
        });
        console.log('Created new lead:', newLead);
        return newLead;
      }));

      // Combine all leads (both updated and new)
      const allLeads = [...updatedLeads, ...createdLeads];
      console.log('All leads processed:', allLeads);

      // Now create calls for all leads
      console.log('Creating calls for all leads...');
      try {
        const createdCalls = await prisma.call.createMany({
          data: allLeads.map(lead => ({
            clientId: clientId,
            callStatus: 'Pending',
            customerNumber: lead.phoneNumber,
            type: 'outboundPhoneCall',
            campaignId: campaign.id,
            leadId: lead.id
          }))
        });

        console.log(`Successfully created ${createdCalls.count} calls`);
      } catch (err) {
        console.error('Detailed error in call creation:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorStack: err instanceof Error ? err.stack : undefined,
          errorName: err instanceof Error ? err.name : 'Unknown',
          meta: err instanceof Prisma.PrismaClientKnownRequestError ? err.meta : undefined,
          timestamp: new Date().toISOString()
        });
        throw err;
      }
    } else {
      console.log('No leads provided or leads array is empty');
    }

    // Return the created campaign with additional info
    const campaignResponse = {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      totalLeads: campaign.totalLeads,
      processedLeads: campaign.processedLeads,
      estimatedCost: parseFloat(campaign.estimatedCost.toString()),
      actualCost: parseFloat(campaign.actualCost.toString()),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      clientId: campaign.clientId,
      message: 'Campaign created successfully with leads and calls'
    };

    console.log('Campaign response:', campaignResponse);

    return NextResponse.json(campaignResponse);
  } catch (error) {
    console.log('Error creating campaign:', error);
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
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
} 