// JavaScript file to avoid TypeScript typing issues
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Transaction table schema...');
    
    // Direct SQL query to check the table schema
    const schemaInfo = await prisma.$queryRaw`SHOW COLUMNS FROM \`Transaction\``;
    console.log('Transaction table columns:', schemaInfo);
    
    // Verify if phoneNumber column exists
    const hasPhoneNumber = schemaInfo.some(column => column.Field === 'phoneNumber');
    console.log('phoneNumber column exists:', hasPhoneNumber);
    
    if (hasPhoneNumber) {
      console.log('Success! The phoneNumber column has been added to the Transaction table.');
    } else {
      console.log('Warning: The phoneNumber column was not found in the Transaction table.');
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 