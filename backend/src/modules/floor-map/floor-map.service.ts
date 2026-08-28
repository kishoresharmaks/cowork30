import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FloorMapService {
  constructor(private prisma: PrismaService) {}

  async getAllFloors(branchId?: number) {
    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const floors = await this.prisma.floorMap.findMany({
      where,
      orderBy: { floorLevel: 'asc' },
      include: {
        branch: true,
        desks: true,
        meetingRooms: true,
      },
    });

    return {
      success: true,
      floors,
    };
  }

  async getFloorMapById(id: number) {
    const floorMap = await this.prisma.floorMap.findUnique({
      where: { id },
      include: {
        branch: true,
        desks: true,
        meetingRooms: true,
      },
    });

    if (!floorMap) {
      throw new NotFoundException('Floor map not found');
    }

    const allFloors = await this.prisma.floorMap.findMany({
      where: { branchId: floorMap.branchId, isActive: true },
      orderBy: { floorLevel: 'asc' },
      select: { id: true, floorName: true, floorLevel: true },
    });

    return {
      success: true,
      floorMap,
      allFloors,
    };
  }

  async getFloorMapByBranch(branchId: number, floorId?: number) {
    let floorMap: any = null;

    if (floorId) {
      floorMap = await this.prisma.floorMap.findUnique({
        where: { id: floorId },
        include: {
          branch: true,
          desks: true,
          meetingRooms: true,
        },
      });
    }

    if (!floorMap) {
      floorMap = await this.prisma.floorMap.findFirst({
        where: { branchId, isActive: true },
        orderBy: { floorLevel: 'asc' },
        include: {
          branch: true,
          desks: true,
          meetingRooms: true,
        },
      });
    }

    if (!floorMap) {
      // Auto create default floor 1 if branch exists but has no floors
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
      if (branch) {
        floorMap = await this.prisma.floorMap.create({
          data: {
            branchId,
            floorName: 'Ground Floor Innovation Hub',
            floorLevel: 1,
          },
          include: {
            branch: true,
            desks: true,
            meetingRooms: true,
          },
        });
      } else {
        throw new NotFoundException('Branch or floor map not found');
      }
    }

    const allFloors = await this.prisma.floorMap.findMany({
      where: { branchId: floorMap.branchId, isActive: true },
      orderBy: { floorLevel: 'asc' },
      select: { id: true, floorName: true, floorLevel: true },
    });

    return {
      success: true,
      floorMap,
      allFloors,
    };
  }

  async createFloor(data: { branchId?: number; floorName: string; floorLevel: number; width?: number; height?: number }) {
    const branchId = data.branchId || 1;
    const floor = await this.prisma.floorMap.create({
      data: {
        branchId,
        floorName: data.floorName.trim(),
        floorLevel: Number(data.floorLevel || 1),
        width: Number(data.width || 1200),
        height: Number(data.height || 800),
        isActive: true,
      },
      include: {
        branch: true,
        desks: true,
      },
    });

    return {
      success: true,
      floorMap: floor,
    };
  }

  async deleteFloor(id: number) {
    const count = await this.prisma.floorMap.count({ where: { isActive: true } });
    if (count <= 1) {
      throw new Error('Cannot delete the only remaining floor plan');
    }

    await this.prisma.desk.deleteMany({ where: { floorMapId: id } });
    await this.prisma.floorMap.delete({ where: { id } });

    return {
      success: true,
      message: 'Floor plan and desks removed successfully',
    };
  }

  async createDesk(data: any) {
    const floorMap = await this.prisma.floorMap.findFirst({ where: { isActive: true } });
    const floorMapId = data.floorMapId || floorMap?.id || 1;

    const desk = await this.prisma.desk.create({
      data: {
        floorMapId,
        deskNumber: data.deskNumber,
        deskType: data.deskType || 'hot_desk',
        xCoordinate: Number(data.xCoordinate || data.xPosition || 100),
        yCoordinate: Number(data.yCoordinate || data.yPosition || 100),
        status: data.status || 'available',
        monthlyPrice: Number(data.monthlyPrice || 5000),
        dailyPrice: Number(data.dailyPrice || 500),
        hasPowerOutlet: Boolean(data.hasPowerOutlet ?? true),
        hasWindowView: Boolean(data.hasWindowView ?? false),
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
      },
    });

    return {
      success: true,
      desk,
    };
  }

  async updateDesk(id: number, data: any) {
    const desk = await this.prisma.desk.update({
      where: { id },
      data: {
        ...(data.deskNumber ? { deskNumber: data.deskNumber } : {}),
        ...(data.deskType ? { deskType: data.deskType } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.monthlyPrice !== undefined ? { monthlyPrice: Number(data.monthlyPrice) } : {}),
        ...(data.dailyPrice !== undefined ? { dailyPrice: Number(data.dailyPrice) } : {}),
        ...(data.xCoordinate !== undefined || data.xPosition !== undefined
          ? { xCoordinate: Number(data.xCoordinate ?? data.xPosition) }
          : {}),
        ...(data.yCoordinate !== undefined || data.yPosition !== undefined
          ? { yCoordinate: Number(data.yCoordinate ?? data.yPosition) }
          : {}),
        ...(data.hasPowerOutlet !== undefined ? { hasPowerOutlet: Boolean(data.hasPowerOutlet) } : {}),
        ...(data.hasWindowView !== undefined ? { hasWindowView: Boolean(data.hasWindowView) } : {}),
      },
    });

    return {
      success: true,
      desk,
    };
  }

  async deleteDesk(id: number) {
    await this.prisma.desk.delete({ where: { id } });
    return {
      success: true,
      message: 'Desk removed successfully',
    };
  }

  async updateDeskStatus(deskId: number, status: string) {
    const updated = await this.prisma.desk.update({
      where: { id: deskId },
      data: { status: status as any },
    });

    return {
      success: true,
      desk: updated,
    };
  }

  async updateFloorDetails(id: number, data: { floorName?: string; floorLevel?: number; branchName?: string }) {
    const existing = await this.prisma.floorMap.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) {
      throw new NotFoundException('Floor map not found');
    }

    if (data.branchName && existing.branchId) {
      await this.prisma.branch.update({
        where: { id: existing.branchId },
        data: { name: data.branchName.trim() },
      });
    }

    const updated = await this.prisma.floorMap.update({
      where: { id },
      data: {
        ...(data.floorName !== undefined ? { floorName: data.floorName.trim() } : {}),
        ...(data.floorLevel !== undefined ? { floorLevel: Number(data.floorLevel) } : {}),
      },
      include: { branch: true, desks: true },
    });

    return {
      success: true,
      floorMap: updated,
    };
  }
}
