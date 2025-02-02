import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create roles
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

  // Create admin user if doesn't exist
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: '$2b$10$YlNxZ0vNE0N6njBA4c3lu.BSvjD6tC7pN9f7D7xQkATDown27kqTW',
      roleId: adminRole.id,
      active: true
    }
  });

  // Create default settings if doesn't exist
  await prisma.setting.upsert({
    where: { key: 'call_rate_multiplier' },
    update: {},
    create: {
      key: 'call_rate_multiplier',
      value: { multiplier: 0.1 },
      category: 'billing',
      label: 'Call Rate Multiplier',
      description: 'Percentage multiplier applied to base call rates',
      isSystem: true
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 