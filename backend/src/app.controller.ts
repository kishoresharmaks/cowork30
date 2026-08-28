import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
