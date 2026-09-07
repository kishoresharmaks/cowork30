import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RateLimitMiddleware } from '../common/middlewares/rate-limit.middleware';

import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    PricingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST })
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/register', method: RequestMethod.POST })
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/forgot-password', method: RequestMethod.POST })
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/reset-password', method: RequestMethod.POST });
  }
}
