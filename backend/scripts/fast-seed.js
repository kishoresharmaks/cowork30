/**
 * Fast Lightweight Database Seeder for MilesWeb (No Rust Binary Download Required)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function runFastSeed() {
  console.log('🌱 Starting lightweight fast seed on MilesWeb MySQL...');

  try {
    // 1. Seed Main Branch
    const branch = await prisma.branch.upsert({
      where: { slug: 'downtown-main-hub' },
      update: {},
      create: {
        name: 'Downtown Main Hub',
        slug: 'downtown-main-hub',
        address: '100 Innovation Boulevard, Suite 500',
        city: 'Tech City',
        state: 'CA',
        zip: '90001',
        phone: '+1 (555) 300-2026',
        email: 'downtown@cowork30.com',
        openingTime: '08:00 AM',
        closingTime: '08:00 PM',
        isActive: true,
      },
    });
    console.log('✅ Branch created:', branch.name);

    // 2. Seed Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cowork30.com' },
      update: {},
      create: {
        branchId: branch.id,
        name: 'System Admin',
        email: 'admin@cowork30.com',
        passwordHash: adminPasswordHash,
        phone: '+1 (555) 000-1111',
        role: 'admin',
        walletBalance: 1000.0,
      },
    });
    console.log('✅ Admin user created:', admin.email);

    // 3. Seed Meeting Rooms
    await prisma.meetingRoom.upsert({
      where: { slug: 'executive-boardroom-suite' },
      update: {},
      create: {
        branchId: branch.id,
        name: 'Executive Boardroom Suite',
        slug: 'executive-boardroom-suite',
        description: 'Premium executive conference suite equipped with 4K AV display.',
        capacity: 12,
        minSeats: 1,
        maxSeats: 12,
        perSeatPrice: 200,
        hourlyRate: 850,
        dailyRate: 6000,
        isActive: true,
      },
    });
    console.log('✅ Meeting rooms seeded.');

    // 4. Seed Pricing Plans
    await prisma.pricingPlan.upsert({
      where: { slug: 'dedicated-pro-desk' },
      update: {},
      create: {
        name: 'Dedicated Pro Desk',
        slug: 'dedicated-pro-desk',
        tagline: 'Reserved ergonomic desk for individuals & small teams',
        priceMonthly: 449,
        priceDaily: 50,
        billingPeriod: 'Monthly',
        meetingCreditsIncluded: 5,
        deskCreditsIncluded: 20,
        isPopular: true,
        isActive: true,
      },
    });
    console.log('✅ Pricing plans seeded.');

    console.log('🎉 Fast seed completed successfully!');
  } catch (err) {
    console.error('❌ Fast seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runFastSeed();
