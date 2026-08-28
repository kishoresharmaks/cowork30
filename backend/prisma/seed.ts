import { PrismaClient, Role, DeskType, DeskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Cowork30...');

  // 1. Create Default Branches
  const mainBranch = await prisma.branch.upsert({
    where: { slug: 'downtown-main-hub' },
    update: {},
    create: {
      name: 'Downtown Main Hub',
      slug: 'downtown-main-hub',
      address: '100 Innovation Boulevard, Suite 500, Tech City',
      city: 'Tech City',
      state: 'CA',
      zip: '90001',
      latitude: 34.0522,
      longitude: -118.2437,
      phone: '+1 (555) 300-2026',
      email: 'downtown@cowork30.com',
      openingTime: '08:00 AM',
      closingTime: '08:00 PM',
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { slug: 'tech-park-sector-62' },
    update: {},
    create: {
      name: 'Tech Park Sector 62',
      slug: 'tech-park-sector-62',
      address: 'Plot 42, Tech Park, Sector 62',
      city: 'Noida',
      state: 'UP',
      zip: '201309',
      latitude: 28.6270,
      longitude: 77.3726,
      phone: '+91 (120) 400-2026',
      email: 'sector62@cowork30.com',
      openingTime: '08:00 AM',
      closingTime: '09:00 PM',
      isActive: true,
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { slug: 'westside-business-bay' },
    update: {},
    create: {
      name: 'Westside Business Bay',
      slug: 'westside-business-bay',
      address: '77 Financial Expressway, Tower B',
      city: 'Cyber City',
      state: 'HR',
      zip: '122002',
      latitude: 28.4595,
      longitude: 77.0266,
      phone: '+91 (124) 500-3026',
      email: 'westside@cowork30.com',
      openingTime: '07:30 AM',
      closingTime: '10:00 PM',
      isActive: true,
    },
  });

  console.log('✅ Branches seeded:', mainBranch.name, branch2.name, branch3.name);

  // 2. Create Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cowork30.com' },
    update: {},
    create: {
      branchId: mainBranch.id,
      name: 'System Admin',
      email: 'admin@cowork30.com',
      passwordHash: adminPasswordHash,
      phone: '+1 (555) 000-1111',
      companyName: 'Cowork30 Corporate',
      role: Role.admin,
      walletBalance: 1000.00,
    },
  });
  console.log('✅ Admin user seeded:', adminUser.email);

  // 3. Create Default Site & Logo Settings
  await prisma.siteSetting.upsert({
    where: { key: 'site_info' },
    update: {},
    create: {
      key: 'site_info',
      value: JSON.stringify({
        companyName: 'Cowork30',
        tagline: 'Your On-Demand Business Solution Partner',
        contactEmail: 'contact@cowork30.com',
        contactPhone: '+1 (555) 300-2026',
        supportAddress: '100 Innovation Boulevard, Suite 500, Tech City',
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

  // 4. Create Floor Map & Desks
  let floorMap = await prisma.floorMap.findFirst({ where: { branchId: mainBranch.id } });
  if (!floorMap) {
    floorMap = await prisma.floorMap.create({
      data: {
        branchId: mainBranch.id,
        floorName: 'Ground Floor Innovation Hub',
        floorLevel: 1,
        width: 1200,
        height: 800,
        isActive: true,
        desks: {
          create: [
            { deskNumber: 'A-101', deskType: DeskType.hot_desk, xCoordinate: 150, yCoordinate: 200, status: DeskStatus.available, monthlyPrice: 250, dailyPrice: 25 },
            { deskNumber: 'A-102', deskType: DeskType.hot_desk, xCoordinate: 250, yCoordinate: 200, status: DeskStatus.available, monthlyPrice: 250, dailyPrice: 25 },
            { deskNumber: 'B-201', deskType: DeskType.dedicated_desk, xCoordinate: 400, yCoordinate: 350, status: DeskStatus.occupied, monthlyPrice: 450, dailyPrice: 45 },
            { deskNumber: 'B-202', deskType: DeskType.dedicated_desk, xCoordinate: 500, yCoordinate: 350, status: DeskStatus.available, monthlyPrice: 450, dailyPrice: 45 },
            { deskNumber: 'C-301', deskType: DeskType.private_cabin, xCoordinate: 750, yCoordinate: 150, width: 120, height: 120, status: DeskStatus.reserved, monthlyPrice: 1200, dailyPrice: 120 },
          ],
        },
      },
    });
  }

  let floorMap2 = await prisma.floorMap.findFirst({ where: { branchId: branch2.id } });
  if (!floorMap2) {
    floorMap2 = await prisma.floorMap.create({
      data: {
        branchId: branch2.id,
        floorName: 'Sector 62 Tech Hub Floor',
        floorLevel: 1,
        width: 1200,
        height: 800,
        isActive: true,
        desks: {
          create: [
            { deskNumber: 'T-101', deskType: DeskType.hot_desk, xCoordinate: 180, yCoordinate: 220, status: DeskStatus.available, monthlyPrice: 280, dailyPrice: 28 },
            { deskNumber: 'T-102', deskType: DeskType.dedicated_desk, xCoordinate: 380, yCoordinate: 320, status: DeskStatus.available, monthlyPrice: 480, dailyPrice: 48 },
            { deskNumber: 'T-Cabin-1', deskType: DeskType.private_cabin, xCoordinate: 700, yCoordinate: 180, width: 140, height: 140, status: DeskStatus.available, monthlyPrice: 1350, dailyPrice: 135 },
          ],
        },
      },
    });
  }

  let floorMap3 = await prisma.floorMap.findFirst({ where: { branchId: branch3.id } });
  if (!floorMap3) {
    floorMap3 = await prisma.floorMap.create({
      data: {
        branchId: branch3.id,
        floorName: 'Westside Executive Floor',
        floorLevel: 2,
        width: 1200,
        height: 800,
        isActive: true,
        desks: {
          create: [
            { deskNumber: 'W-201', deskType: DeskType.hot_desk, xCoordinate: 200, yCoordinate: 250, status: DeskStatus.available, monthlyPrice: 300, dailyPrice: 30 },
            { deskNumber: 'W-202', deskType: DeskType.dedicated_desk, xCoordinate: 450, yCoordinate: 300, status: DeskStatus.available, monthlyPrice: 500, dailyPrice: 50 },
            { deskNumber: 'W-Suite-A', deskType: DeskType.private_cabin, xCoordinate: 800, yCoordinate: 200, width: 150, height: 150, status: DeskStatus.available, monthlyPrice: 1500, dailyPrice: 150 },
          ],
        },
      },
    });
  }
  console.log('✅ Floor Maps and Desks seeded for all branches');

  // 5. Create Services
  const servicesData = [
    {
      name: 'Hot Desk Membership',
      slug: 'hot-desk',
      shortDescription: 'Flexible work seats in a vibrant collaborative open lounge.',
      detailedDescription: 'Work wherever you like in our spacious open workspace. Enjoy ultra-fast Wi-Fi, premium espresso, ergonomic seating, and vibrant community networking.',
      iconClass: 'Laptop',
      featuredImage: '/images/hot-desk.jpg',
      sortOrder: 1,
    },
    {
      name: 'Dedicated Desk',
      slug: 'dedicated-desk',
      shortDescription: 'Your reserved desk with a personal lockable cabinet & 24/7 access.',
      detailedDescription: 'Settle into your permanent workspace. Equipped with dual-monitor mounting arms, personal storage, ergonomic Herman Miller chair, and 24/7 keycard access.',
      iconClass: 'Armchair',
      featuredImage: '/images/dedicated-desk.jpg',
      sortOrder: 2,
    },
    {
      name: 'Private Executive Cabins',
      slug: 'private-cabin',
      shortDescription: 'Fully furnished private office suites for teams of 2 to 20.',
      detailedDescription: 'Secure soundproof office suites designed for privacy and high productivity. Custom branding, executive desks, and dedicated conference room credits included.',
      iconClass: 'Building2',
      featuredImage: '/images/private-office.jpg',
      sortOrder: 3,
    },
    {
      name: 'Virtual Office & GST Registration',
      slug: 'virtual-office',
      shortDescription: 'Prestigious corporate address, mail handling, and GST compliance.',
      detailedDescription: 'Establish your business presence without physical overhead. Includes corporate address, official mail receipt and forwarding, phone answering, and GST registration support.',
      iconClass: 'MailCheck',
      featuredImage: '/images/virtual-office.jpg',
      sortOrder: 4,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, branchId: mainBranch.id },
    });
  }
  console.log('✅ Services seeded');

  // 6. Create Pricing Plans & Features
  await prisma.pricingPlan.upsert({
    where: { slug: 'flex-desk-pass' },
    update: {},
    create: {
      name: 'Day Pass / Flex Desk',
      slug: 'flex-desk-pass',
      tagline: 'Ideal for freelancers and digital nomads needing on-demand desk access.',
      priceMonthly: 199.00,
      priceDaily: 25.00,
      meetingCreditsIncluded: 2,
      deskCreditsIncluded: 10,
      isPopular: false,
      sortOrder: 1,
      features: {
        create: [
          { featureText: 'Access to open coworking lounge', isIncluded: true },
          { featureText: 'Ultra-fast Gigabit Wi-Fi', isIncluded: true },
          { featureText: 'Unlimited gourmet coffee & tea', isIncluded: true },
          { featureText: '2 Hours Meeting Room Credits / Month', isIncluded: true },
          { featureText: 'Dedicated Storage Cabinet', isIncluded: false },
        ],
      },
    },
  });

  await prisma.pricingPlan.upsert({
    where: { slug: 'dedicated-pro' },
    update: {},
    create: {
      name: 'Dedicated Pro Member',
      slug: 'dedicated-pro',
      tagline: 'Designed for full-time professionals needing a permanent assigned seat.',
      priceMonthly: 449.00,
      priceDaily: 45.00,
      meetingCreditsIncluded: 8,
      deskCreditsIncluded: 30,
      isPopular: true,
      sortOrder: 2,
      features: {
        create: [
          { featureText: 'Assigned permanent ergonomic desk', isIncluded: true },
          { featureText: 'Personal lockable filing cabinet', isIncluded: true },
          { featureText: '24/7 Keycard Building Access', isIncluded: true },
          { featureText: '8 Hours Meeting Room Credits / Month', isIncluded: true },
          { featureText: 'Official Mail & Address Services', isIncluded: true },
        ],
      },
    },
  });
  console.log('✅ Pricing Plans seeded');

  // 7. Create Meeting Rooms
  const existingRoom1 = await prisma.meetingRoom.findUnique({ where: { slug: 'boardroom-alpha' } });
  if (!existingRoom1) {
    await prisma.meetingRoom.create({
      data: {
        branchId: mainBranch.id,
        name: 'Boardroom Alpha (12-Seater)',
        slug: 'boardroom-alpha',
        description: 'Executive 12-person conference room with 4K interactive TV, video conferencing bar, and glass whiteboard.',
        capacity: 12,
        hourlyRate: 65.00,
        dailyRate: 450.00,
        amenities: ['4K Smart TV', 'Video Conference Bar', 'Glass Whiteboard', 'Espresso Machine', 'High-Speed Wi-Fi'],
        images: ['/images/meeting-room-1.jpg'],
        sortOrder: 1,
      },
    });
  }

  const existingRoom2 = await prisma.meetingRoom.findUnique({ where: { slug: 'innovation-pod' } });
  if (!existingRoom2) {
    await prisma.meetingRoom.create({
      data: {
        branchId: mainBranch.id,
        name: 'Innovation Pod (4-Seater)',
        slug: 'innovation-pod',
        description: 'Soundproof small group huddle room for client calls, interview sessions, and brain-storming.',
        capacity: 4,
        hourlyRate: 30.00,
        dailyRate: 200.00,
        amenities: ['HD Monitor', 'Whiteboard', 'Soundproof Acoustic Panels', 'Wi-Fi'],
        images: ['/images/meeting-room-2.jpg'],
        sortOrder: 2,
      },
    });
  }

  const room3 = await prisma.meetingRoom.findUnique({ where: { slug: 'sector62-conference-suite' } });
  if (!room3) {
    await prisma.meetingRoom.create({
      data: {
        branchId: branch2.id,
        name: 'Sector 62 Tech Conference (10-Seater)',
        slug: 'sector62-conference-suite',
        description: 'Modern conference suite with smart display and high-definition video setup.',
        capacity: 10,
        hourlyRate: 55.00,
        dailyRate: 400.00,
        amenities: ['4K Smart TV', 'Video Conference Bar', 'Glass Whiteboard', 'High-Speed Wi-Fi'],
        images: ['/images/meeting-room-1.jpg'],
        sortOrder: 1,
      },
    });
  }

  const room4 = await prisma.meetingRoom.findUnique({ where: { slug: 'westside-executive-boardroom' } });
  if (!room4) {
    await prisma.meetingRoom.create({
      data: {
        branchId: branch3.id,
        name: 'Westside Executive Boardroom (16-Seater)',
        slug: 'westside-executive-boardroom',
        description: 'Luxury executive boardroom designed for corporate board meetings and investor presentations.',
        capacity: 16,
        hourlyRate: 85.00,
        dailyRate: 600.00,
        amenities: ['Dual 4K Screens', 'Dolby Audio Conference System', 'Whiteboard', 'Artisanal Coffee Bar'],
        images: ['/images/meeting-room-2.jpg'],
        sortOrder: 1,
      },
    });
  }
  console.log('✅ Meeting Rooms seeded for all branches');

  // 8. Create Add-Ons
  await prisma.addon.createMany({
    data: [
      { name: 'Executive Coffee & Tea Service', description: 'Fresh brewed artisanal coffee & tea setup for your meeting attendees.', price: 5.00, unit: 'per_person', category: 'catering' },
      { name: 'Gourmet Lunch Box Platter', description: 'Assorted fresh wraps, sandwiches, salad, and beverage.', price: 18.00, unit: 'per_person', category: 'catering' },
      { name: '4K Projection & Wireless Clicker Kit', description: 'High-lumens 4K laser projector with wireless HDMI clicker.', price: 25.00, unit: 'per_booking', category: 'equipment' },
    ],
  });
  console.log('✅ Add-ons seeded');

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
