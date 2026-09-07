import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './modules/shared/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello() {
    return {
      success: true,
      message: '🚀 Cowork30 Enterprise Platform API v1 is active and running',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
    };
  }

  @Get('v1')
  getV1Hello() {
    return this.getHello();
  }

  @Get('api/v1')
  getApiV1Hello() {
    return this.getHello();
  }

  @Get('health')
  async getHealth() {
    const start = Date.now();
    let dbStatus: 'healthy' | 'degraded' | 'down' = 'down';
    let dbLatencyMs: number | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
      dbLatencyMs = Date.now() - start;
    } catch {
      dbStatus = 'down';
    }

    const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    };
  }
}
