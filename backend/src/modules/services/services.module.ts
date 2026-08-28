import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesChatGateway } from './services-chat.gateway';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, ServicesChatGateway],
  exports: [ServicesService, ServicesChatGateway],
})
export class ServicesModule {}
