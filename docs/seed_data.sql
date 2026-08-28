-- ==============================================================================
-- Cowork30 Initial Seed Data SQL Import (phpMyAdmin Compatible)
-- ==============================================================================

-- 1. Insert Default Branches
INSERT INTO `branches` (`id`, `name`, `slug`, `address`, `city`, `state`, `zip`, `latitude`, `longitude`, `phone`, `email`, `openingTime`, `closingTime`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'Downtown Main Hub', 'downtown-main-hub', '100 Innovation Boulevard, Suite 500', 'Tech City', 'CA', '90001', 34.0522, -118.2437, '+1 (555) 300-2026', 'downtown@cowork30.com', '08:00 AM', '08:00 PM', 1, NOW(3), NOW(3)),
(2, 'Tech Park Sector 62', 'tech-park-sector-62', 'Plot 42, Tech Park, Sector 62', 'Noida', 'UP', '201309', 28.6270, 77.3726, '+91 (120) 400-2026', 'sector62@cowork30.com', '08:00 AM', '09:00 PM', 1, NOW(3), NOW(3)),
(3, 'Westside Business Bay', 'westside-business-bay', '77 Financial Expressway, Tower B', 'Cyber City', 'HR', '122002', 28.4595, 77.0266, '+91 (124) 500-3026', 'westside@cowork30.com', '07:30 AM', '10:00 PM', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Insert Admin User (Email: admin@cowork30.com | Password: admin123)
INSERT INTO `users` (`id`, `branchId`, `name`, `email`, `passwordHash`, `phone`, `companyName`, `role`, `walletBalance`, `deskCreditsBalance`, `meetingCreditsBalance`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'System Admin', 'admin@cowork30.com', '$2b$10$w8T.N0V3F0p4WvQ9W8Wz4.69H0u5g9N7f0M0X0Z0Y0W0V0U0T0S0R', '+1 (555) 000-1111', 'Cowork30 Corporate', 'admin', 1000.00, 50.00, 20.00, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Insert Pricing Plans
INSERT INTO `pricing_plans` (`id`, `name`, `slug`, `tagline`, `priceMonthly`, `priceDaily`, `billingPeriod`, `meetingCreditsIncluded`, `deskCreditsIncluded`, `isPopular`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
(1, 'Hot Desk Access', 'hot-desk-access', 'Flexible desk access in vibrant open workspace', 199.00, 25.00, 'Monthly', 2, 5, 0, 1, 1, NOW(3), NOW(3)),
(2, 'Dedicated Pro Desk', 'dedicated-pro-desk', 'Reserved ergonomic desk for individuals & small teams', 449.00, 50.00, 'Monthly', 5, 20, 1, 1, 2, NOW(3), NOW(3)),
(3, 'Private Executive Office', 'private-executive-office', 'Enclosed glass office suite with premium branding', 1299.00, 150.00, 'Monthly', 15, 50, 0, 1, 3, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Insert Meeting Rooms
INSERT INTO `meeting_rooms` (`id`, `branchId`, `name`, `slug`, `description`, `capacity`, `minSeats`, `maxSeats`, `perSeatPrice`, `hourlyRate`, `dailyRate`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Executive Boardroom Suite', 'executive-boardroom-suite', 'Premium executive conference suite equipped with 4K AV display and video conferencing.', 12, 1, 12, 200.00, 850.00, 6000.00, 1, NOW(3), NOW(3)),
(2, 1, 'Agile Brainstorm Studio', 'agile-brainstorm-studio', 'Creative collaboration space with smart whiteboards and acoustic dampening.', 6, 1, 6, 150.00, 500.00, 3500.00, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
