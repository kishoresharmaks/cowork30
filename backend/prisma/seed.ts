import { PrismaClient, Role, DeskType, DeskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Cowork30...');


  // 2. Create Admin User
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (adminPassword === 'admin123') {
    console.warn('⚠️ WARNING: Using default admin password. Please set ADMIN_PASSWORD in your .env for production.');
  }
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cowork30.com' },
    update: {
      phone: '+91 9820431183',
      companyName: 'Ishwarji Cowork 30',
    },
    create: {
      name: 'System Admin',
      email: 'admin@cowork30.com',
      passwordHash: adminPasswordHash,
      phone: '+91 9820431183',
      companyName: 'Ishwarji Cowork 30',
      role: Role.admin,
      walletBalance: 1000.00,
    },
  });
  console.log('✅ Admin user seeded:', adminUser.email);

  // 3. Create Default Site & Logo Settings
  await prisma.siteSetting.upsert({
    where: { key: 'site_info' },
    update: {
      value: JSON.stringify({
        companyName: 'Ishwarji Cowork 30',
        tagline: 'Your On-Demand Business Solution Partner',
        contactEmail: 'cowork307@gmail.com',
        contactPhone: 'Off: 7708888765 / 022-62396303 | Mob: 9820431183',
        supportAddress: '201, 2nd Floor, ACME Plaza No 2, Opp. Sangam Cinema, Andheri Kurla Road, Chakala, Andheri East, Mumbai 400059',
        website: 'https://www.cowork30.com',
        brandPrimaryColor: '#F43F5E',
        brandSecondaryColor: '#9333EA',
      }),
    },
    create: {
      key: 'site_info',
      value: JSON.stringify({
        companyName: 'Ishwarji Cowork 30',
        tagline: 'Your On-Demand Business Solution Partner',
        contactEmail: 'cowork307@gmail.com',
        contactPhone: 'Off: 7708888765 / 022-62396303 | Mob: 9820431183',
        supportAddress: '201, 2nd Floor, ACME Plaza No 2, Opp. Sangam Cinema, Andheri Kurla Road, Chakala, Andheri East, Mumbai 400059',
        website: 'https://www.cowork30.com',
        brandPrimaryColor: '#F43F5E',
        brandSecondaryColor: '#9333EA',
      }),
    },
  });

  await prisma.logoSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      logoName: 'Cowork30 Primary Logo',
      lightLogoUrl: '/Logo.png',
      darkLogoUrl: '/Logo.png',
      faviconUrl: '/favicon.ico',
      widthPx: 180,
      heightPx: 50,
      isActive: true,
    },
  });
  console.log('✅ Site and Logo Settings seeded');



  console.log('🎉 Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
