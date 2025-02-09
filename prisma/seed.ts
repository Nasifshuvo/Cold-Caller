import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Create Roles
    console.log('Creating roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator'
      }
    });

    const clientRole = await prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: {
        name: 'CLIENT',
        description: 'Client User'
      }
    });

    console.log('Roles created:', { adminRole, clientRole });

    // 2. Create Admin User
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        roleId: adminRole.id,
        active: true
      }
    });

    console.log('Admin user created:', adminUser);

    // 3. Create Call Rate Multiplier Setting
    // This matches your settings page implementation
    await prisma.setting.upsert({
      where: { key: 'call_rate_multiplier' },
      update: {},
      create: {
        key: 'call_rate_multiplier',
        value: { multiplier: 1.0 }, // 100% - no markup by default
        category: 'billing',
        label: 'Call Rate Multiplier',
        description: 'Percentage multiplier applied to base call rates',
        isSystem: true
      }
    });

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 