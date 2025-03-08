import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    
    // Get only successful/ended calls
    const calls = await prisma.call.findMany({
      where: { 
        clientId,
        // Filter for completed calls
        callStatus: 'Completed'
      },
    });
    
    // Calculate statistics
    const totalCampaigns = campaigns.length;
    const totalCalls = calls.length;
    let totalDuration = 0;
    
    // Sum up the durations
    calls.forEach(call => {
      if (call.durationInSeconds) {
        totalDuration += call.durationInSeconds;
      }
    });
    
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