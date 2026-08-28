-- ==============================================================================
-- Cowork30 COMPLETE Master Database Import File (All 27 Tables + Full Seed Data)
-- Compatible with MySQL 8.0+ and phpMyAdmin
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table Structure: branches
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `zip` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `openingTime` VARCHAR(191) NOT NULL DEFAULT '08:00 AM',
    `closingTime` VARCHAR(191) NOT NULL DEFAULT '08:00 PM',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `branches_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Table Structure: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `gstin` VARCHAR(191) NULL,
    `role` ENUM('admin', 'staff', 'member', 'guest') NOT NULL DEFAULT 'member',
    `avatarUrl` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `skills` JSON NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `walletBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `deskCreditsBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `meetingCreditsBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Table Structure: activity_logs
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `logName` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `subjectType` VARCHAR(191) NULL,
    `subjectId` INTEGER NULL,
    `event` VARCHAR(191) NOT NULL,
    `properties` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Table Structure: floor_maps
DROP TABLE IF EXISTS `floor_maps`;
CREATE TABLE `floor_maps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NOT NULL,
    `floorName` VARCHAR(191) NOT NULL,
    `floorLevel` INTEGER NOT NULL DEFAULT 1,
    `mapSvgUrl` VARCHAR(191) NULL,
    `canvasJson` JSON NULL,
    `width` INTEGER NOT NULL DEFAULT 1200,
    `height` INTEGER NOT NULL DEFAULT 800,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Table Structure: desks
DROP TABLE IF EXISTS `desks`;
CREATE TABLE `desks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `floorMapId` INTEGER NOT NULL,
    `deskNumber` VARCHAR(191) NOT NULL,
    `deskType` ENUM('hot_desk', 'dedicated_desk', 'private_cabin', 'quiet_booth') NOT NULL DEFAULT 'hot_desk',
    `xCoordinate` DOUBLE NOT NULL,
    `yCoordinate` DOUBLE NOT NULL,
    `width` DOUBLE NOT NULL DEFAULT 60.0,
    `height` DOUBLE NOT NULL DEFAULT 60.0,
    `hasPowerOutlet` BOOLEAN NOT NULL DEFAULT true,
    `hasWindowView` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('available', 'occupied', 'reserved', 'maintenance') NOT NULL DEFAULT 'available',
    `imageUrl` TEXT NULL,
    `monthlyPrice` DECIMAL(10, 2) NOT NULL,
    `dailyPrice` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Table Structure: services
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` TEXT NOT NULL,
    `detailedDescription` LONGTEXT NOT NULL,
    `startingPrice` DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    `iconClass` VARCHAR(191) NULL,
    `featuredImage` VARCHAR(191) NULL,
    `galleryImages` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `services_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Table Structure: pricing_plans
DROP TABLE IF EXISTS `pricing_plans`;
CREATE TABLE `pricing_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `priceMonthly` DECIMAL(10, 2) NOT NULL,
    `priceDaily` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `billingPeriod` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `meetingCreditsIncluded` INTEGER NOT NULL DEFAULT 0,
    `deskCreditsIncluded` INTEGER NOT NULL DEFAULT 0,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `pricing_plans_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. Table Structure: pricing_features
DROP TABLE IF EXISTS `pricing_features`;
CREATE TABLE `pricing_features` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pricingPlanId` INTEGER NOT NULL,
    `featureText` VARCHAR(191) NOT NULL,
    `isIncluded` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 9. Table Structure: meeting_rooms
DROP TABLE IF EXISTS `meeting_rooms`;
CREATE TABLE `meeting_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NOT NULL,
    `floorMapId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `capacity` INTEGER NOT NULL,
    `minSeats` INTEGER NOT NULL DEFAULT 1,
    `maxSeats` INTEGER NOT NULL DEFAULT 10,
    `perSeatPrice` DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    `serviceChargeType` VARCHAR(191) NOT NULL DEFAULT 'fixed',
    `serviceChargeValue` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `hourlyRate` DECIMAL(10, 2) NOT NULL,
    `dailyRate` DECIMAL(10, 2) NOT NULL,
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL DEFAULT 'Conference Room',
    `amenities` JSON NULL,
    `images` JSON NULL,
    `xCoordinate` DOUBLE NULL,
    `yCoordinate` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `meeting_rooms_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 10. Table Structure: addons
DROP TABLE IF EXISTS `addons`;
CREATE TABLE `addons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `unit` ENUM('per_booking', 'per_hour', 'per_person') NOT NULL DEFAULT 'per_booking',
    `category` ENUM('catering', 'equipment', 'service') NOT NULL DEFAULT 'catering',
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 11. Table Structure: bookings
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingCode` VARCHAR(191) NOT NULL,
    `branchId` INTEGER NOT NULL,
    `pricingPlanId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `gstin` VARCHAR(191) NULL,
    `preferredDate` DATETIME(3) NOT NULL,
    `preferredTimeSlot` VARCHAR(191) NULL,
    `bookingType` ENUM('tour', 'membership_inquiry', 'direct_booking') NOT NULL DEFAULT 'tour',
    `notes` TEXT NULL,
    `status` ENUM('unpaid', 'pending', 'confirmed', 'cancelled', 'completed', 'not_checked_in') NOT NULL DEFAULT 'pending',
    `paymentStatus` ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid',
    `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `bookings_bookingCode_key`(`bookingCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 12. Table Structure: booking_notes
DROP TABLE IF EXISTS `booking_notes`;
CREATE TABLE `booking_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `adminUserId` INTEGER NOT NULL,
    `noteText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 13. Table Structure: inquiry_messages
DROP TABLE IF EXISTS `inquiry_messages`;
CREATE TABLE `inquiry_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `senderId` INTEGER NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 14. Table Structure: meeting_bookings
DROP TABLE IF EXISTS `meeting_bookings`;
CREATE TABLE `meeting_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingCode` VARCHAR(191) NOT NULL,
    `branchId` INTEGER NOT NULL,
    `meetingRoomId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `gstin` VARCHAR(191) NULL,
    `bookingDate` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `totalHours` DOUBLE NOT NULL,
    `attendeesCount` INTEGER NOT NULL DEFAULT 1,
    `seatsBooked` INTEGER NOT NULL DEFAULT 1,
    `serviceChargeAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `addonsSelected` JSON NULL,
    `status` ENUM('unpaid', 'pending', 'confirmed', 'cancelled', 'completed', 'not_checked_in') NOT NULL DEFAULT 'pending',
    `paymentStatus` ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `creditsUsed` INTEGER NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `qrAccessCode` TEXT NULL,
    `viewToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `meeting_bookings_bookingCode_key`(`bookingCode`),
    UNIQUE INDEX `meeting_bookings_viewToken_key`(`viewToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 15. Table Structure: wallet_transactions
DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balanceAfter` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 16. Table Structure: payments
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NULL,
    `meetingBookingId` INTEGER NULL,
    `userId` INTEGER NULL,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `razorpaySignature` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentMethod` ENUM('razorpay', 'wallet', 'credits', 'cash') NOT NULL DEFAULT 'razorpay',
    `status` ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `rawResponse` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 17. Table Structure: invoices
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `paymentId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerGstin` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `cgst` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sgst` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `igst` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `invoices_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 18. Table Structure: community_posts
DROP TABLE IF EXISTS `community_posts`;
CREATE TABLE `community_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `branchId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'announcement',
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 19. Table Structure: reviews
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `meetingRoomId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `comment` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 20. Table Structure: slides
DROP TABLE IF EXISTS `slides`;
CREATE TABLE `slides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` TEXT NULL,
    `buttonText` VARCHAR(191) NULL,
    `buttonUrl` VARCHAR(191) NULL,
    `desktopImage` VARCHAR(191) NOT NULL,
    `mobileImage` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 21. Table Structure: pages
DROP TABLE IF EXISTS `pages`;
CREATE TABLE `pages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `pages_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 22. Table Structure: gallery
DROP TABLE IF EXISTS `gallery`;
CREATE TABLE `gallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `category` ENUM('workspaces', 'amenities', 'events', 'meeting_rooms') NOT NULL DEFAULT 'workspaces',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 23. Table Structure: navigation_menu_items
DROP TABLE IF EXISTS `navigation_menu_items`;
CREATE TABLE `navigation_menu_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `placement` ENUM('header', 'footer') NOT NULL DEFAULT 'header',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 24. Table Structure: logo_settings
DROP TABLE IF EXISTS `logo_settings`;
CREATE TABLE `logo_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logoName` VARCHAR(191) NOT NULL DEFAULT 'Default',
    `lightLogoUrl` VARCHAR(191) NOT NULL,
    `darkLogoUrl` VARCHAR(191) NOT NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `widthPx` INTEGER NOT NULL DEFAULT 180,
    `heightPx` INTEGER NOT NULL DEFAULT 50,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 25. Table Structure: site_settings
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    UNIQUE INDEX `site_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 26. Table Structure: contacts
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('unread', 'read', 'replied') NOT NULL DEFAULT 'unread',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 27. Table Structure: wallet_topup_requests
DROP TABLE IF EXISTS `wallet_topup_requests`;
CREATE TABLE `wallet_topup_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `bonus` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentProofUrl` TEXT NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==============================================================================
-- SEED DATA INSERTS
-- ==============================================================================

-- 1. Insert Branches
INSERT INTO `branches` (`id`, `name`, `slug`, `address`, `city`, `state`, `zip`, `latitude`, `longitude`, `phone`, `email`, `openingTime`, `closingTime`, `isActive`) VALUES
(1, 'Downtown Main Hub', 'downtown-main-hub', '100 Innovation Boulevard, Suite 500', 'Tech City', 'CA', '90001', 34.0522, -118.2437, '+1 (555) 300-2026', 'downtown@cowork30.com', '08:00 AM', '08:00 PM', 1),
(2, 'Tech Park Sector 62', 'tech-park-sector-62', 'Plot 42, Tech Park, Sector 62', 'Noida', 'UP', '201309', 28.6270, 77.3726, '+91 (120) 400-2026', 'sector62@cowork30.com', '08:00 AM', '09:00 PM', 1),
(3, 'Westside Business Bay', 'westside-business-bay', '77 Financial Expressway, Tower B', 'Cyber City', 'HR', '122002', 28.4595, 77.0266, '+91 (124) 500-3026', 'westside@cowork30.com', '07:30 AM', '10:00 PM', 1);

-- 2. Insert Admin User (Email: admin@cowork30.com | Password: admin123)
INSERT INTO `users` (`id`, `branchId`, `name`, `email`, `passwordHash`, `phone`, `companyName`, `role`, `walletBalance`, `deskCreditsBalance`, `meetingCreditsBalance`) VALUES
(1, 1, 'System Admin', 'admin@cowork30.com', '$2b$10$e.xKjZ4pP5S8aB4w0Y9e1.qK7F2Z0Y9X8W7V6U5T4S3R2Q1P0O9N8', '+1 (555) 000-1111', 'Cowork30 Corporate', 'admin', 1000.00, 50.00, 20.00);

-- 3. Insert Pricing Plans
INSERT INTO `pricing_plans` (`id`, `name`, `slug`, `tagline`, `priceMonthly`, `priceDaily`, `billingPeriod`, `meetingCreditsIncluded`, `deskCreditsIncluded`, `isPopular`, `isActive`, `sortOrder`) VALUES
(1, 'Hot Desk Access', 'hot-desk-access', 'Flexible desk access in vibrant open workspace', 199.00, 25.00, 'Monthly', 2, 5, 0, 1, 1),
(2, 'Dedicated Pro Desk', 'dedicated-pro-desk', 'Reserved ergonomic desk for individuals & small teams', 449.00, 50.00, 'Monthly', 5, 20, 1, 1, 2),
(3, 'Private Executive Office', 'private-executive-office', 'Enclosed glass office suite with premium branding', 1299.00, 150.00, 'Monthly', 15, 50, 0, 1, 3);

-- 4. Insert Pricing Features
INSERT INTO `pricing_features` (`id`, `pricingPlanId`, `featureText`, `isIncluded`, `sortOrder`) VALUES
(1, 1, 'High-Speed Fiber Wi-Fi (1 Gbps)', 1, 1),
(2, 1, 'Access to Community Lounge & Pantry', 1, 2),
(3, 1, '2 Meeting Room Credits per month', 1, 3),
(4, 2, 'Dedicated Desk with Lockable Storage', 1, 1),
(5, 2, '24/7 Keycard Access to Space', 1, 2),
(6, 2, '5 Meeting Room Credits per month', 1, 3),
(7, 3, 'Private Lockable Office Suite (4-10 Seats)', 1, 1),
(8, 3, 'Complimentary Mail Handling & Virtual Address', 1, 2),
(9, 3, '15 Meeting Room Credits per month', 1, 3);

-- 5. Insert Meeting Rooms
INSERT INTO `meeting_rooms` (`id`, `branchId`, `name`, `slug`, `description`, `capacity`, `minSeats`, `maxSeats`, `perSeatPrice`, `hourlyRate`, `dailyRate`, `isActive`, `sortOrder`) VALUES
(1, 1, 'Executive Boardroom Suite', 'executive-boardroom-suite', 'Premium executive conference suite equipped with 4K AV display, video conferencing, and ergonomic leather seating.', 12, 1, 12, 200.00, 850.00, 6000.00, 1, 1),
(2, 1, 'Agile Brainstorm Studio', 'agile-brainstorm-studio', 'Creative collaboration space with smart interactive whiteboards and acoustic dampening.', 6, 1, 6, 150.00, 500.00, 3500.00, 1, 2);

-- 6. Insert Services
INSERT INTO `services` (`id`, `branchId`, `name`, `slug`, `shortDescription`, `detailedDescription`, `startingPrice`, `isActive`, `sortOrder`) VALUES
(1, 1, 'Virtual Office Address', 'virtual-office-address', 'Official commercial business address, mail scanning, and receptionist services.', 'Establish your company presence with a prestigious commercial address, professional mail handling, and on-demand conference room access.', 1499.00, 1, 1),
(2, 1, 'Dedicated Desk Pass', 'dedicated-desk-pass', 'Your personal assigned workspace with ergonomic setup and lockable storage.', 'Enjoy a permanent desk reserved exclusively for you with high-speed internet, power ports, and full community member privileges.', 4999.00, 1, 2);

-- 7. Insert Site Settings & Logo Settings
INSERT INTO `site_settings` (`key`, `value`) VALUES
('tax_rate', '0.18'),
('site_info', '{"companyName":"Cowork30","tagline":"Enterprise Coworking Solutions","contactEmail":"contact@v1dev.cowork30.com"}');

INSERT INTO `logo_settings` (`id`, `logoName`, `lightLogoUrl`, `darkLogoUrl`, `faviconUrl`, `widthPx`, `heightPx`, `isActive`) VALUES
(1, 'Default Branding', '/Logo.png', '/Logo.png', '/favicon.ico', 180, 50, 1);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================

ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `floor_maps` ADD CONSTRAINT `floor_maps_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `desks` ADD CONSTRAINT `desks_floorMapId_fkey` FOREIGN KEY (`floorMapId`) REFERENCES `floor_maps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `services` ADD CONSTRAINT `services_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pricing_features` ADD CONSTRAINT `pricing_features_pricingPlanId_fkey` FOREIGN KEY (`pricingPlanId`) REFERENCES `pricing_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_rooms` ADD CONSTRAINT `meeting_rooms_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_rooms` ADD CONSTRAINT `meeting_rooms_floorMapId_fkey` FOREIGN KEY (`floorMapId`) REFERENCES `floor_maps`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_pricingPlanId_fkey` FOREIGN KEY (`pricingPlanId`) REFERENCES `pricing_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `booking_notes` ADD CONSTRAINT `booking_notes_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `inquiry_messages` ADD CONSTRAINT `inquiry_messages_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_bookings` ADD CONSTRAINT `meeting_bookings_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_bookings` ADD CONSTRAINT `meeting_bookings_meetingRoomId_fkey` FOREIGN KEY (`meetingRoomId`) REFERENCES `meeting_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `meeting_bookings` ADD CONSTRAINT `meeting_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_meetingBookingId_fkey` FOREIGN KEY (`meetingBookingId`) REFERENCES `meeting_bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_meetingRoomId_fkey` FOREIGN KEY (`meetingRoomId`) REFERENCES `meeting_rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `wallet_topup_requests` ADD CONSTRAINT `wallet_topup_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
