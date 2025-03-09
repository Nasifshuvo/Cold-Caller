import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CallStatus } from '@/types/callStatus';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { client: true }
    });

    if (!user?.client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientId = user.client.id;

    // Get total campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { clientId },
    });
    
    // Log existing call statuses to debug
    console.log("Fetching call statistics for client:", clientId);
    
    // Get all completed calls
    const calls = await prisma.call.findMany({
      where: { 
        clientId,
        callStatus: CallStatus.COMPLETED, // Use the enum value
        // Only include calls with a duration
        durationInSeconds: { 
          not: null,
          gt: 0
        }
      },
    });
    
    console.log(`Found ${calls.length} completed calls`);
    
    // Calculate statistics
    const totalCampaigns = campaigns.length;
    const totalCalls = calls.length;
    let totalDuration = 0;
    
    // Sum up the durations
    calls.forEach(call => {
      if (call.durationInSeconds) {
        console.log(`Call ID: ${call.id}, Duration: ${call.durationInSeconds}s, Status: ${call.callStatus}`);
        totalDuration += call.durationInSeconds;
      }
    });
    
    console.log(`Total duration: ${totalDuration}s`);
    
    return NextResponse.json({
      totalCampaigns,
      totalCalls,
      totalDuration
    });

  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign statistics' },
      { status: 500 }
    );
  }
} 