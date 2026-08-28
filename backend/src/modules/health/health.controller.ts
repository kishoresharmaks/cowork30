import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Public Health Check Endpoint for Render Keep-Alive / Cron Ping' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'Cowork30 API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
