import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ServicesModule } from './modules/services/services.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MeetingRoomsModule } from './modules/meeting-rooms/meeting-rooms.module';
import { FloorMapModule } from './modules/floor-map/floor-map.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CmsModule } from './modules/cms/cms.module';
import { WalletBillingModule } from './modules/wallet-billing/wallet-billing.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    ServicesModule,
    PricingModule,
    MeetingRoomsModule,
    FloorMapModule,
    BookingsModule,
    CmsModule,
    WalletBillingModule,
    ReportsModule,
  ],
})
export class AppModule {}
