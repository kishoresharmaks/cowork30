import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.branch.findUnique({
      where: { slug },
      include: {
        floorMaps: true,
        meetingRooms: true,
        services: true,
      },
    });
  }

  async findByIdOrSlug(idOrSlug: string) {
    const numericId = parseInt(idOrSlug, 10);
    if (!isNaN(numericId)) {
      return this.prisma.branch.findUnique({
        where: { id: numericId },
        include: {
          floorMaps: true,
          meetingRooms: true,
          services: true,
        },
      });
    }
    return this.findBySlug(idOrSlug);
  }

  async findAllAdmin() {
    return this.prisma.branch.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            floorMaps: true,
            meetingRooms: true,
            services: true,
            users: true,
          },
        },
      },
    });
  }

  async createBranch(data: any) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const branch = await this.prisma.branch.create({
      data: {
        name: data.name,
        slug,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        phone: data.phone || '',
        email: data.email || '',
        openingTime: data.openingTime || '08:00 AM',
        closingTime: data.closingTime || '08:00 PM',
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        isActive: Boolean(data.isActive ?? true),
      },
    });

    return {
      success: true,
      message: 'Branch created successfully',
      branch,
    };
  }

  async updateBranch(id: number, data: any) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Branch not found');
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.zip !== undefined ? { zip: data.zip } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.openingTime !== undefined ? { openingTime: data.openingTime } : {}),
        ...(data.closingTime !== undefined ? { closingTime: data.closingTime } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude ? parseFloat(data.latitude) : null } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude ? parseFloat(data.longitude) : null } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
      },
    });

    return {
      success: true,
      message: 'Branch updated successfully',
      branch: updated,
    };
  }

  async toggleStatus(id: number) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Branch not found');
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return {
      success: true,
      message: `Branch ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      branch: updated,
    };
  }

  async deleteBranch(id: number) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Branch not found');
    }

    await this.prisma.branch.delete({ where: { id } });
    return {
      success: true,
      message: 'Branch deleted successfully',
    };
  }
}
