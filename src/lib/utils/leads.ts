import prisma from '@/lib/prisma';

interface LeadData {
  phoneNumber: string;
  name?: string;
}

export async function createLeadsFromImport(
  clientId: number,
  fileName: string,
  leads: LeadData[]
) {
  console.log('Starting lead import with:', { clientId, fileName, leadsCount: leads.length });
  
  return await prisma.$transaction(async (tx) => {
    console.log('Creating lead import record');
    const leadImport = await tx.leadImport.create({
      data: {
        clientId,
        fileName,
        totalLeads: leads.length,
      }
    });
    console.log('Lead import created:', leadImport);

    const createdLeads = await Promise.all(
      leads.map(async (lead) => {
        console.log('Processing lead:', lead);
        const newLead = await tx.lead.upsert({
          where: {
            clientId_phoneNumber: {
              clientId,
              phoneNumber: lead.phoneNumber
            }
          },
          create: {
            clientId,
            importId: leadImport.id,
            phoneNumber: lead.phoneNumber,
            name: lead.name,
            callStatus: "Not Initiated"
          },
          update: {
            importId: leadImport.id
          }
        });
        console.log('Lead processed:', newLead);
        return newLead;
      })
    );

    console.log('All leads processed:', createdLeads.length);
    return { leadImport, leads: createdLeads };
  });
} 