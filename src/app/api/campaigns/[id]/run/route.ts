import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createOutboundCall } from '@/lib/vapi/createOutboundCall';
import { getVapiConfig } from '@/lib/vapi/config';
import { Prisma } from '@prisma/client';


export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('Campaign run request received');
  
  const { id } = await context.params;
  
  // Validate and parse the ID
  if (!id || isNaN(parseInt(id))) {
    console.error('Invalid campaign ID:', id);
    return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
  }

  const campaignId = parseInt(id);
  console.log('Processing campaign ID:', campaignId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching user details for:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          select: {
            id: true,
            vapiKey: true,
            vapiAssistantId: true,
            vapiPhoneNumberId: true,
            balanceInSeconds: true
          }
        }
      },
    });

    if (!user?.client) {
      console.error('Client not found for user:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Log VAPI configuration
    console.log('Checking VAPI configuration:', {
      hasVapiKey: !!user.client.vapiKey,
      hasAssistantId: !!user.client.vapiAssistantId,
      hasPhoneNumberId: !!user.client.vapiPhoneNumberId
    });

    // Validate VAPI credentials
    if (!user.client.vapiKey || !user.client.vapiAssistantId || !user.client.vapiPhoneNumberId) {
      console.error('Missing VAPI configuration for client:', user.client.id);
      return NextResponse.json({ error: 'VAPI configuration not found' }, { status: 400 });
    }

    // Get campaign and its leads
    console.log('Fetching campaign details...');
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        clientId: user.client.id,
      },
      include: {
        leads: true
      }
    });

    if (!campaign) {
      console.error('Campaign not found:', campaignId);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('Campaign details:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: campaign.totalLeads,
      leadsCount: campaign.leads.length
    });

    if (campaign.status !== 'Draft') {
      console.error('Invalid campaign status:', campaign.status);
      return NextResponse.json({ error: 'Campaign is not in draft status' }, { status: 400 });
    }

    // Check client balance
    const clientBalanceInSeconds = user.client.balanceInSeconds ? parseFloat(user.client.balanceInSeconds.toString()) : 0;
    const campaignEstimatedSeconds = campaign.estimatedSeconds ? parseFloat(campaign.estimatedSeconds.toString()) : 0;

    console.log('Checking client balance:', {
      clientBalanceInSeconds,
      campaignEstimatedSeconds,
    });

    if (clientBalanceInSeconds < campaignEstimatedSeconds) {
      console.error('Insufficient balance:', clientBalanceInSeconds);
      return NextResponse.json({
        error: `Insufficient balance. Required: ${(campaignEstimatedSeconds / 60).toFixed(2)} minutes, Available: ${(clientBalanceInSeconds / 60).toFixed(2)} minutes.`
      }, { status: 400 });
    }

    // Update campaign status to Running
    console.log('Updating campaign status to Running...');
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'Running' }
    });

    // Get all pending calls for this campaign
    console.log('Fetching pending calls...');
    const pendingCalls = await prisma.call.findMany({
      where: {
        AND: [
          { campaignId: campaignId },
          { callStatus: 'Pending' }
        ]
      }
    });

    console.log('Campaign call details:', {
      campaignId,
      totalPendingCalls: pendingCalls.length,
      timestamp: new Date().toISOString()
    });

    // Process each pending call
    for (const call of pendingCalls) {
      try {
        if (!call.customerNumber) {
          console.error('Invalid call record:', {
            callId: call.id,
            error: 'Missing phone number',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        console.log('Processing call:', {
          callId: call.id,
          customerNumber: call.customerNumber,
          leadId: call.leadId,
          timestamp: new Date().toISOString()
        });
        
        // Initialize VAPI for each call
        console.log('Initializing VAPI configuration...');
        const vapiConfig = getVapiConfig();
        vapiConfig.init({
          apiKey: user.client.vapiKey,
          assistantId: user.client.vapiAssistantId,
          phoneNumberId: user.client.vapiPhoneNumberId,
        });

        console.log('Making VAPI call for:', {
          callId: call.id,
          customerNumber: call.customerNumber,
          timestamp: new Date().toISOString()
        });

        const callResponse = await createOutboundCall(call.customerNumber);
        console.log('VAPI Call Response:', {
          callId: callResponse.id,
          status: callResponse.status,
          createdAt: callResponse.createdAt,
          timestamp: new Date().toISOString()
        });
        
        if (callResponse.id) {
          // Update call record
          console.log('Updating call record with VAPI response...');
          const updatedCall = await prisma.call.update({
            where: {
              id: call.id
            },
            data: {
              callStatus: 'Initiated',
              vapiCallId: callResponse.id,
              startedAt: new Date(callResponse.createdAt),
              type: callResponse.type,
              assistantId: callResponse.assistantId,
              webCallUrl: callResponse.monitor?.controlUrl,
            }
          });

          console.log('Call record updated:', {
            callId: updatedCall.id,
            status: updatedCall.callStatus,
            vapiCallId: updatedCall.vapiCallId,
            timestamp: new Date().toISOString()
          });

          // Update lead status
          if (call.leadId) {
            console.log('Updating lead status...');
            await prisma.lead.update({
              where: { id: call.leadId },
              data: { 
                callStatus: 'Initiated',
                response: `Call initiated with ID: ${callResponse.id}`
              }
            });
          }

          // Update campaign processed leads count
          console.log('Updating campaign processed leads count...');
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              processedLeads: {
                increment: 1
              }
            }
          });

          console.log('Call processing completed successfully:', {
            callId: call.id,
            vapiCallId: callResponse.id,
            customerNumber: call.customerNumber,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error('VAPI call creation failed:', {
            callId: call.id,
            customerNumber: call.customerNumber,
            error: 'No call ID received',
            timestamp: new Date().toISOString()
          });
          throw new Error('Failed to get call ID from VAPI');
        }
      } catch (error) {
        console.error('Call processing failed:', {
          callId: call.id,
          customerNumber: call.customerNumber,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        // Update call status to Failed
        console.log('Updating call status to Failed...');
        await prisma.call.update({
          where: { id: call.id },
          data: {
            callStatus: 'Failed',
            response: error instanceof Error ? error.message : 'Call initiation failed'
          }
        });

        // Update lead status to Failed
        if (call.leadId) {
          console.log('Updating lead status to Failed...');
          await prisma.lead.update({
            where: { id: call.leadId },
            data: { 
              callStatus: 'Failed',
              response: error instanceof Error ? error.message : 'Call initiation failed'
            }
          });
        }
      }
    }

    // Update campaign status to Initiated
    console.log('Updating campaign status to Initiated...');
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'Initiated' }
    });

    console.log('Campaign processing completed:', {
      campaignId,
      processedCalls: pendingCalls.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: 'Campaign calls initiated successfully',
      campaignId: campaignId,
      processedCalls: pendingCalls.length
    });
  } catch (error) {
    console.error('Campaign run failed:', {
      campaignId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // If it's a Prisma error, we can be more specific
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ 
        error: `Database error: ${error.message}`
      }, { 
        status: 400 
      });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
} 