import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FloorMapService } from './floor-map.service';

@ApiTags('Floor Map')
@Controller('floor-map')
export class FloorMapController {
  constructor(private readonly floorMapService: FloorMapService) {}

  @Get('floors/all')
  @ApiOperation({ summary: 'Admin / Customer: Get all active floor maps' })
  async getAllFloors(@Query('branchId') branchId?: string) {
    const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;
    return this.floorMapService.getAllFloors(branchIdNum);
  }

  @Get('floor/:id')
  @ApiOperation({ summary: 'Get single floor map by ID' })
  async getFloorById(@Param('id', ParseIntPipe) id: number) {
    return this.floorMapService.getFloorMapById(id);
  }

  @Post('floor')
  @ApiOperation({ summary: 'Admin: Create a new floor map' })
  async createFloor(@Body() body: { branchId?: number; floorName: string; floorLevel: number; width?: number; height?: number }) {
    return this.floorMapService.createFloor(body);
  }

  @Delete('floor/:id')
  @ApiOperation({ summary: 'Admin: Delete floor map and all its desks' })
  async deleteFloor(@Param('id', ParseIntPipe) id: number) {
    return this.floorMapService.deleteFloor(id);
  }

  @Get(':branchId')
  @ApiOperation({ summary: 'Get 2D interactive floor map & desk status layout for a branch' })
  async getFloorMap(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Query('floorId') floorId?: string,
  ) {
    const floorIdNum = floorId ? parseInt(floorId, 10) : undefined;
    return this.floorMapService.getFloorMapByBranch(branchId, floorIdNum);
  }

  @Post('desk')
  @ApiOperation({ summary: 'Admin: Create a new desk entry on the floor map' })
  async createDesk(@Body() body: any) {
    return this.floorMapService.createDesk(body);
  }

  @Put('desk/:id')
  @ApiOperation({ summary: 'Admin: Update desk specifications, rates (₹), or map coordinates' })
  async updateDesk(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.floorMapService.updateDesk(id, body);
  }

  @Delete('desk/:id')
  @ApiOperation({ summary: 'Admin: Delete desk from floor map' })
  async deleteDesk(@Param('id', ParseIntPipe) id: number) {
    return this.floorMapService.deleteDesk(id);
  }

  @Put('desk/:id/status')
  @ApiOperation({ summary: 'Admin: Change live desk availability status' })
  async updateDeskStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    return this.floorMapService.updateDeskStatus(id, body.status);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update floor plan details (Floor Name, Level, Branch Name)' })
  async updateFloorDetails(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { floorName?: string; floorLevel?: number; branchName?: string },
  ) {
    return this.floorMapService.updateFloorDetails(id, body);
  }
}
