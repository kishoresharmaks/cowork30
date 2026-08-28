import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookingType, BookingStatus, PaymentStatus } from '@prisma/client';
import { ServicesChatGateway } from './services-chat.gateway';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ServicesChatGateway,
  ) {}

  async findAll(includeInactive = false, branchId?: number) {
    const whereClause: any = includeInactive ? {} : { isActive: true };
    if (branchId) {
      whereClause.OR = [
        { branchId },
        { branchId: null },
      ];
    }
    return this.prisma.service.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { isPublished: true },
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createServiceInquiry(data: any) {
    const branch = await this.prisma.branch.findFirst();
    const plan = await this.prisma.pricingPlan.findFirst();

    const branchId = branch ? branch.id : 1;
    const pricingPlanId = plan ? plan.id : 1;
    const bookingCode = `SRV-${Date.now().toString(36).toUpperCase()}`;

    let estimatedTotal = 5000 * Number(data.seatsCount || 1);
    if (data.startingPrice && !isNaN(Number(data.startingPrice))) {
      estimatedTotal = Number(data.startingPrice) * Number(data.seatsCount || 1);
    } else if (data.serviceName) {
      const srv = await this.prisma.service.findFirst({
        where: { name: { contains: data.serviceName } },
      });
      if (srv && srv.startingPrice) {
        estimatedTotal = Number(srv.startingPrice) * Number(data.seatsCount || 1);
      }
    }

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        branchId,
        pricingPlanId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        companyName: data.companyName,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : new Date(),
        preferredTimeSlot: data.preferredTimeSlot || 'Morning 10:00 AM',
        bookingType: BookingType.tour,
        notes: `Solution: ${data.serviceName || 'Workspace Solution'} | Seats: ${data.seatsCount || 1} | Notes: ${data.notes || 'N/A'}`,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        totalAmount: estimatedTotal,
      },
    });

    return {
      success: true,
      message: 'Workspace solution inquiry submitted successfully',
      booking,
    };
  }

  async createService(data: any) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const galleryImages = Array.isArray(data.galleryImages)
      ? data.galleryImages
      : typeof data.galleryImagesText === 'string'
      ? data.galleryImagesText.split('\n').map((u: string) => u.trim()).filter((u: string) => u.length > 0)
      : null;

    const service = await this.prisma.service.create({
      data: {
        name: data.name,
        branchId: data.branchId ? Number(data.branchId) : null,
        slug,
        shortDescription: data.shortDescription || '',
        detailedDescription: data.fullDescription || data.detailedDescription || '',
        startingPrice: Number(data.startingPrice || 5000),
        iconClass: data.icon || data.iconClass || 'Building2',
        featuredImage: data.imageUrl || data.featuredImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        galleryImages: galleryImages ? JSON.parse(JSON.stringify(galleryImages)) : null,
        isActive: Boolean(data.isActive ?? true),
        sortOrder: Number(data.sortOrder || 1),
      },
    });

    return {
      success: true,
      service,
    };
  }

  async updateService(id: number, data: any) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    const galleryImages = Array.isArray(data.galleryImages)
      ? data.galleryImages
      : typeof data.galleryImagesText === 'string'
      ? data.galleryImagesText.split('\n').map((u: string) => u.trim()).filter((u: string) => u.length > 0)
      : undefined;

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.branchId !== undefined ? { branchId: data.branchId ? Number(data.branchId) : null } : {}),
        ...(data.shortDescription !== undefined ? { shortDescription: data.shortDescription } : {}),
        ...(data.fullDescription !== undefined || data.detailedDescription !== undefined
          ? { detailedDescription: data.fullDescription || data.detailedDescription }
          : {}),
        ...(data.startingPrice !== undefined ? { startingPrice: Number(data.startingPrice) } : {}),
        ...(data.icon || data.iconClass ? { iconClass: data.icon || data.iconClass } : {}),
        ...(data.imageUrl || data.featuredImage ? { featuredImage: data.imageUrl || data.featuredImage } : {}),
        ...(galleryImages !== undefined ? { galleryImages: JSON.parse(JSON.stringify(galleryImages)) } : {}),
        ...(data.isActive !== undefined ? { isActive: Boolean(data.isActive) } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: Number(data.sortOrder) } : {}),
      },
    });

    return {
      success: true,
      service: updated,
    };
  }

  async deleteService(id: number) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.delete({ where: { id } });
    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }

  async findAllInquiries(branchId?: number) {
    const whereClause: any = {
      OR: [
        { bookingCode: { startsWith: 'SRV-' } },
        { notes: { contains: 'Solution:' } },
      ],
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const inquiries = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        branch: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      inquiries,
    };
  }

  async updateInquiryStatus(id: number, status?: BookingStatus, totalAmount?: number, paymentStatus?: PaymentStatus) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Inquiry not found');
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;
    if (totalAmount !== undefined && !isNaN(Number(totalAmount))) {
      dataToUpdate.totalAmount = Number(totalAmount);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: dataToUpdate,
      include: { branch: true },
    });

    let sysText = '';
    if (totalAmount !== undefined) {
      sysText += `Negotiated quote updated to ₹${Number(totalAmount).toLocaleString()}. `;
    }
    if (status) {
      sysText += `Inquiry status changed to '${status}'. `;
    }
    if (paymentStatus) {
      sysText += `Payment status changed to '${paymentStatus}'. `;
    }

    if (sysText) {
      await this.sendInquiryMessage(id, 'system', 'System Notification', sysText.trim());
    }

    this.chatGateway.notifyInquiryUpdate(id, 'status_change', updated);

    return {
      success: true,
      inquiry: updated,
    };
  }

  async deleteInquiry(id: number) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Inquiry not found');
    }

    await this.prisma.booking.delete({ where: { id } });
    return {
      success: true,
      message: 'Inquiry deleted successfully',
    };
  }

  async getInquiryMessages(bookingId: number) {
    const messages = await this.prisma.inquiryMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
    return {
      success: true,
      messages,
    };
  }

  async sendInquiryMessage(
    bookingId: number,
    senderType: string,
    senderName: string,
    message: string,
    senderId?: number,
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Inquiry not found');
    }

    if (booking.paymentStatus === PaymentStatus.paid && senderType !== 'system') {
      throw new BadRequestException('Discussion is closed for this inquiry as payment has been completed.');
    }

    const msg = await this.prisma.inquiryMessage.create({
      data: {
        bookingId,
        senderType,
        senderName,
        message,
        senderId: senderId || null,
      },
    });

    this.chatGateway.notifyNewMessage(bookingId, msg);

    return {
      success: true,
      message: msg,
    };
  }
}
