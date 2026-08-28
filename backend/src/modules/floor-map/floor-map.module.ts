import { Module } from '@nestjs/common';
import { FloorMapService } from './floor-map.service';
import { FloorMapController } from './floor-map.controller';
import { FloorMapGateway } from './floor-map.gateway';

@Module({
  controllers: [FloorMapController],
  providers: [FloorMapService, FloorMapGateway],
  exports: [FloorMapService, FloorMapGateway],
})
export class FloorMapModule {}
