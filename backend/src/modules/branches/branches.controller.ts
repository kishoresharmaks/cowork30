import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active coworking space branches' })
  async findAll() {
    return this.branchesService.findAll();
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all branches including inactive with counts' })
  async findAllAdmin() {
    return this.branchesService.findAllAdmin();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get branch details by ID or URL slug' })
  async findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.branchesService.findByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create a new branch location' })
  async createBranch(@Body() body: any) {
    return this.branchesService.createBranch(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update branch details' })
  async updateBranch(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.branchesService.updateBranch(id, body);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Toggle branch active/inactive status' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete branch' })
  async deleteBranch(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.deleteBranch(id);
  }
}
