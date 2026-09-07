import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CmsService } from './cms.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const uploadsDir = join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('CMS & Settings')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('homepage')
  @ApiOperation({ summary: 'Get home page dynamic data (slides, featured services, plans, logos)' })
  async getHomepageData() {
    return this.cmsService.getHomepageData();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get platform site settings including dynamic welcome bonus amount' })
  async getSettings() {
    return this.cmsService.getSettings();
  }

  @Put('settings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update platform settings (Welcome bonus, branding, contact info)' })
  async updateSettings(@Body() body: any) {
    return this.cmsService.updateSettings(body);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff', 'member')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an image file (JPG, PNG, WEBP, AVIF)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req: any, file: any, callback: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          callback(null, `img-${uniqueSuffix}${ext.toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
      fileFilter: (req: any, file: any, callback: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return callback(new BadRequestException('Only image files (JPG, PNG, WEBP, GIF, AVIF) are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const relativeUrl = `/uploads/${file.filename}`;
    const fullUrl = `${backendUrl}${relativeUrl}`;

    return {
      success: true,
      url: fullUrl,
      relativeUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get dynamic page content by URL slug' })
  async getPageBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Get('navigation')
  @ApiOperation({ summary: 'Get active header and footer navigation menu items' })
  async getNavigationItems() {
    return this.cmsService.getNavigationItems();
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Get photo gallery items filterable by category' })
  async getGallery(@Query('category') category?: string) {
    return this.cmsService.getGallery(category);
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit a contact form message (public)' })
  @ApiConsumes('application/json')
  async submitContact(@Body() body: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    return this.cmsService.submitContact(body);
  }

  @Post('gallery')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Add a new photo to gallery' })
  async addGalleryItem(@Body() body: any) {
    return this.cmsService.addGalleryItem(body);
  }

  @Delete('gallery/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete a photo from gallery' })
  async deleteGalleryItem(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteGalleryItem(id);
  }
}
