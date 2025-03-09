import prisma from '@/lib/prisma';
import { CallStatus, ACTIVE_CALL_STATUSES } from '@/types/callStatus';

/**
 * Campaign statuses
 */
export enum CampaignStatus {
  DRAFT = 'Draft',
  RUNNING = 'Running',
  COMPLETED = 'Completed',
  PAUSED = 'Paused',
}

/**
 * Checks and updates a campaign's status based on its calls
 * @param campaignId The ID of the campaign to check
 * @returns The updated campaign object
 */
export async function checkAndUpdateCampaignStatus(campaignId: number | null) {
  if (!campaignId) {
    console.log('No campaign ID provided for status check');
    return null;
  }

  console.log(`Checking campaign status for campaign ID: ${campaignId}`);

  try {
    // Get the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        calls: true,
      },
    });

    if (!campaign) {
      console.log(`Campaign not found with ID: ${campaignId}`);
      return null;
    }

    // Count calls by status
    const totalCalls = campaign.calls.length;
    const activeCalls = campaign.calls.filter(call => 
      ACTIVE_CALL_STATUSES.includes(call.callStatus as CallStatus)
    ).length;
    
    const completedCalls = campaign.calls.filter(call => 
      call.callStatus === CallStatus.COMPLETED
    ).length;

    // Log the call status counts
    console.log(`Campaign ${campaignId} call stats:`, {
      totalCalls,
      activeCalls,
      completedCalls,
    });

    // Update campaign status based on call statuses
    let newStatus = campaign.status;
    let totalProcessed = campaign.processedLeads;

    // Calculate total duration from completed calls
    const totalDuration = campaign.calls
      .filter(call => call.callStatus === CallStatus.COMPLETED)
      .reduce((total, call) => total + (call.durationInSeconds || 0), 0);

    // If there are no active calls and the campaign is running, mark it as completed
    if (activeCalls === 0 && campaign.status === CampaignStatus.RUNNING) {
      newStatus = CampaignStatus.COMPLETED;
      totalProcessed = totalCalls;
      console.log(`Updating campaign ${campaignId} to Completed status`);
    }

    // Update the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: newStatus,
        processedLeads: totalProcessed,
        actualSeconds: totalDuration,
      },
    });

    console.log(`Campaign ${campaignId} updated:`, {
      status: updatedCampaign.status,
      processedLeads: updatedCampaign.processedLeads,
      actualSeconds: updatedCampaign.actualSeconds,
    });

    return updatedCampaign;
  } catch (error) {
    console.error('Error checking campaign status:', error);
    return null;
  }
} 