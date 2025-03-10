import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Transaction phoneNumber field...');
    
    // Check existing transaction schema
    const schemaInfo = await prisma.$queryRaw`DESCRIBE \`Transaction\``;
    console.log('Transaction table schema:', schemaInfo);
    
    // Find an existing client for the test
    const client = await prisma.client.findFirst();
    
    if (!client) {
      console.error('No client found in the database. Please create a client first.');
      return;
    }
    
    console.log(`Using client ID: ${client.id} for the test`);
    
    // Create a transaction with phoneNumber
    const transaction = await prisma.transaction.create({
      data: {
        type: 'TEST',
        clientId: client.id,
        seconds: 0,
        phoneNumber: '1234567890',
        reason: 'Testing phoneNumber field'
      }
    });
    
    console.log('Successfully created transaction with phone number:', transaction);
    
    // Fetch the transaction to verify
    const fetchedTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id }
    });
    
    console.log('Fetched transaction:', fetchedTransaction);
    console.log('Phone number value:', fetchedTransaction?.phoneNumber);
    
    // Clean up
    await prisma.transaction.delete({
      where: { id: transaction.id }
    });
    
    console.log('Test successfully completed. The phoneNumber field is working correctly!');
  } catch (error) {
    console.error('Error testing phoneNumber field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 