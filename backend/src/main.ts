import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as helmet from 'helmet';
import { corsOriginDelegate } from './shared/utils/cors.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers via Helmet
  app.use(
    helmet.default({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }),
  );

  // Serve uploaded images statically at /uploads/, /api/v1/uploads/, and /api/v1/cms/uploads/
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });
  app.useStaticAssets(uploadsDir, {
    prefix: '/api/v1/uploads/',
  });
  app.useStaticAssets(uploadsDir, {
    prefix: '/api/v1/cms/uploads/',
  });

  // Enable CORS for Next.js frontend (supports process.env.FRONTEND_URL, custom domain cowork30.com, onrender.com & local network IPs)
  app.enableCors({
    origin: corsOriginDelegate,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global Validation Pipe using class-validator & class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global API Prefix
  const globalPrefix = process.env.GLOBAL_PREFIX || 'api/v1';
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Cowork30 Platform REST API')
    .setDescription(
      'Enterprise Modular NestJS API Blueprint for Coworking Space Management, Booking Engine, Floor Map, Wallet & Invoicing.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & Profile operations')
    .addTag('Branches', 'Branch location listings & management')
    .addTag('Services', 'Workspace services catalog')
    .addTag('Pricing', 'Membership plans & Tour booking inquiry')
    .addTag('Meeting Rooms', 'Hourly/Daily meeting room booking engine')
    .addTag('Floor Map', 'Interactive 2D Desk Picker & WebSocket updates')
    .addTag('Bookings', 'Tour & Desk reservation manager')
    .addTag(
      'Wallet & Billing',
      'Credit Wallet, Razorpay Checkout & GST Invoices',
    )
    .addTag('CMS & Settings', 'Site branding, hero sliders, pages & gallery')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(
    `🚀 Server running on http://0.0.0.0:${port}/api/v1 (accessible locally & via local network IP)`,
  );
  logger.log(
    `📚 Interactive Swagger API Docs available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
