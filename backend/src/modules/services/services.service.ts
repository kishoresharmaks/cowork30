import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BookingType, BookingStatus, PaymentStatus } from '@prisma/client';
import { ServicesChatGateway } from './services-chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ServicesChatGateway,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  async findAll(includeInactive = false, branchId?: number, category?: string) {
    if (process.env.SEED_ON_STARTUP === 'true') {
      await this.ensureSeedServices();
    }

    const whereClause: any = includeInactive ? {} : { isActive: true };
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (branchId) {
      whereClause.OR = [{ branchId }, { branchId: null }];
    }
    return this.prisma.service.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
    });
  }

  private async ensureSeedServices() {
    try {
      const count = await this.prisma.service.count();
      if (count === 0) {
        await this.prisma.service.createMany({
          data: [
            {
              name: 'Hot Desk Membership',
              slug: 'hot-desk',
              category: 'workspace',
              requiresSeats: 'required',
              requiresDate: 'required',
              pricingUnit: 'month',
              shortDescription:
                'Flexible open ergonomic seating across premium lounge zones with ultra-fast Wi-Fi.',
              detailedDescription:
                'Work from any available seat in our ergonomic open floor lounge. Includes high-speed fiber internet, unlimited premium coffee, printing credits, and access to all community networking mixers.',
              startingPrice: 4999,
              iconClass: 'Sparkles',
              featuredImage:
                'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 1,
            },
            {
              name: 'Dedicated Desk Suite',
              slug: 'dedicated-desk',
              category: 'workspace',
              requiresSeats: 'required',
              requiresDate: 'required',
              pricingUnit: 'month',
              shortDescription:
                'Your own permanent reserved desk with lockable storage and 24/7 keycard access.',
              detailedDescription:
                'Never worry about finding a spot. Your reserved desk comes with an ergonomic chair, dual-monitor plug points, personal filing cabinet, and monthly meeting room credits.',
              startingPrice: 7999,
              iconClass: 'Armchair',
              featuredImage:
                'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 2,
            },
            {
              name: 'Private Executive Cabin',
              slug: 'private-cabin',
              category: 'workspace',
              requiresSeats: 'required',
              requiresDate: 'required',
              pricingUnit: 'month',
              shortDescription:
                'Acoustically treated glass cabins for focused teams and executive confidentiality.',
              detailedDescription:
                'Fully furnished private office suite equipped with custom branding, sound isolation, keycard security, and dedicated high-speed VLAN.',
              startingPrice: 14999,
              iconClass: 'Building2',
              featuredImage:
                'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 3,
            },
            {
              name: 'Virtual Office & GST Plan',
              slug: 'virtual-office',
              category: 'workspace',
              requiresSeats: 'none',
              requiresDate: 'flexible',
              pricingUnit: 'month',
              shortDescription:
                'Prestigious business address for GST & MCA registration with daily mail handling.',
              detailedDescription:
                'Register your company or new state GST with prime address proof, NOC, utility bills, and digital mail forwarding.',
              startingPrice: 1999,
              iconClass: 'MailCheck',
              featuredImage:
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 4,
            },
            {
              name: 'Loan Syndicate & Project Funding',
              slug: 'loan-syndicate',
              category: 'professional',
              requiresSeats: 'optional',
              requiresDate: 'flexible',
              pricingUnit: 'quote',
              shortDescription:
                'Commercial debt finance, machinery loans, working capital, and multi-bank syndication.',
              detailedDescription:
                'End-to-end debt syndication and project funding solutions for MSMEs, startups, and growing enterprises. Our institutional finance partners assist with DPR preparation, CMA data structuring, and banking consortium liaison.',
              startingPrice: 0,
              iconClass: 'Landmark',
              featuredImage:
                'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 5,
            },
            {
              name: 'Land Promoters & Commercial Expansion',
              slug: 'land-promoters',
              category: 'professional',
              requiresSeats: 'none',
              requiresDate: 'flexible',
              pricingUnit: 'consultation',
              shortDescription:
                'Commercial land aggregation, DTCP/CMDA approvals, and prime real estate promoter advisory.',
              detailedDescription:
                'Strategic land advisory services connecting investors, business operators, and land promoters. We provide legal title vetting, land zoning verification, joint-venture structuring, and warehouse/commercial site acquisition.',
              startingPrice: 2500,
              iconClass: 'Compass',
              featuredImage:
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 6,
            },
            {
              name: 'Tax Experts, CA & Compliance Hub',
              slug: 'tax-experts',
              category: 'professional',
              requiresSeats: 'optional',
              requiresDate: 'flexible',
              pricingUnit: 'consultation',
              shortDescription:
                'Dedicated Chartered Accountants for GST audits, tax filings, company incorporation, and CFO advisory.',
              detailedDescription:
                'Full-spectrum corporate tax, audit, and legal compliance solutions. Our certified CA partners handle statutory filings, income tax disputes, 80IAC startup tax exemption certifications, and cross-border structuring.',
              startingPrice: 1999,
              iconClass: 'ShieldCheck',
              featuredImage:
                'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
              isActive: true,
              sortOrder: 7,
            },
          ],
        });
      } else {
        const hasProfessional = await this.prisma.service.findFirst({
          where: { category: 'professional' },
        });
        if (!hasProfessional) {
          await this.prisma.service.createMany({
            data: [
              {
                name: 'Loan Syndicate & Project Funding',
                slug: 'loan-syndicate',
                category: 'professional',
                requiresSeats: 'optional',
                requiresDate: 'flexible',
                pricingUnit: 'quote',
                shortDescription:
                  'Commercial debt finance, machinery loans, working capital, and multi-bank syndication.',
                detailedDescription:
                  'End-to-end debt syndication and project funding solutions for MSMEs, startups, and growing enterprises. Our institutional finance partners assist with DPR preparation, CMA data structuring, and banking consortium liaison.',
                startingPrice: 0,
                iconClass: 'Landmark',
                featuredImage:
                  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
                isActive: true,
                sortOrder: 5,
              },
              {
                name: 'Land Promoters & Commercial Expansion',
                slug: 'land-promoters',
                category: 'professional',
                requiresSeats: 'none',
                requiresDate: 'flexible',
                pricingUnit: 'consultation',
                shortDescription:
                  'Commercial land aggregation, DTCP/CMDA approvals, and prime real estate promoter advisory.',
                detailedDescription:
                  'Strategic land advisory services connecting investors, business operators, and land promoters. We provide legal title vetting, land zoning verification, joint-venture structuring, and warehouse/commercial site acquisition.',
                startingPrice: 2500,
                iconClass: 'Compass',
                featuredImage:
                  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
                isActive: true,
                sortOrder: 6,
              },
              {
                name: 'Tax Experts, CA & Compliance Hub',
                slug: 'tax-experts',
                category: 'professional',
                requiresSeats: 'optional',
                requiresDate: 'flexible',
                pricingUnit: 'consultation',
                shortDescription:
                  'Dedicated Chartered Accountants for GST audits, tax filings, company incorporation, and CFO advisory.',
                detailedDescription:
                  'Full-spectrum corporate tax, audit, and legal compliance solutions. Our certified CA partners handle statutory filings, income tax disputes, 80IAC startup tax exemption certifications, and cross-border structuring.',
                startingPrice: 1999,
                iconClass: 'ShieldCheck',
                featuredImage:
                  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
                isActive: true,
                sortOrder: 7,
              },
            ],
          });
        }
      }
    } catch (err) {
      console.error('Service seeding check notice:', err);
    }
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

    let serviceRecord: any = null;
    if (data.serviceId) {
      serviceRecord = await this.prisma.service.findUnique({
        where: { id: Number(data.serviceId) },
      });
    } else if (data.serviceName) {
      serviceRecord = await this.prisma.service.findFirst({
        where: { name: { contains: data.serviceName } },
      });
    }

    const isSeatNeeded =
      data.isSeatNeeded !== undefined ? Boolean(data.isSeatNeeded) : true;
    const seatsCount = isSeatNeeded ? Number(data.seatsCount || 1) : 0;
    const isDateFlexible = Boolean(data.isDateFlexible || false);
    const consultationType =
      data.consultationType || (isSeatNeeded ? 'desk_included' : 'in_person');
    const serviceName =
      serviceRecord?.name || data.serviceName || 'Custom Solution';
    const category =
      serviceRecord?.category ||
      (serviceName.toLowerCase().includes('loan') ||
      serviceName.toLowerCase().includes('tax') ||
      serviceName.toLowerCase().includes('land')
        ? 'professional'
        : 'workspace');

    let estimatedTotal = 0;
    const unitPrice = serviceRecord
      ? Number(serviceRecord.startingPrice)
      : 5000;
    const pricingUnit = serviceRecord?.pricingUnit || 'month';

    if (pricingUnit === 'quote' || unitPrice === 0) {
      estimatedTotal = 0; // Custom quotation by admin
    } else if (!isSeatNeeded) {
      estimatedTotal = unitPrice; // Flat service or consultation fee
    } else {
      estimatedTotal = unitPrice * Math.max(1, seatsCount);
    }

    const notesSummary = [
      `Service: ${serviceName}`,
      `Category: ${category.toUpperCase()}`,
      `Consultation: ${consultationType === 'virtual' ? 'Online / Video Call' : consultationType === 'in_person' ? 'Center In-Person' : 'Workspace Desk Included'}`,
      `Seats: ${isSeatNeeded ? `${seatsCount} Seat(s)` : 'Not Needed (Remote / Advisory Only)'}`,
      `Date: ${isDateFlexible ? 'Flexible / Earliest Available' : data.preferredDate || 'Standard Date'}`,
      `Customer Notes: ${data.notes || 'N/A'}`,
    ].join(' | ');

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        branchId,
        pricingPlanId,
        serviceId: serviceRecord ? serviceRecord.id : null,
        userId: data.userId ? Number(data.userId) : null,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        companyName: data.companyName,
        preferredDate: data.preferredDate
          ? new Date(data.preferredDate)
          : new Date(),
        preferredTimeSlot:
          data.preferredTimeSlot ||
          (isDateFlexible ? 'Flexible' : 'Morning 10:00 AM'),
        bookingType: BookingType.tour,
        isSeatNeeded,
        seatsCount: isSeatNeeded ? Math.max(1, seatsCount) : 0,
        isDateFlexible,
        consultationType,
        notes: notesSummary,
        status: BookingStatus.pending,
        paymentStatus: PaymentStatus.unpaid,
        totalAmount: estimatedTotal,
      },
      include: {
        service: true,
        branch: true,
      },
    });

    return {
      success: true,
      message: 'Workspace solution inquiry submitted successfully',
      booking,
    };
  }

  async createService(data: any) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    const galleryImages = Array.isArray(data.galleryImages)
      ? data.galleryImages
      : typeof data.galleryImagesText === 'string'
        ? data.galleryImagesText
            .split('\n')
            .map((u: string) => u.trim())
            .filter((u: string) => u.length > 0)
        : null;

    const service = await this.prisma.service.create({
      data: {
        name: data.name,
        branchId: data.branchId ? Number(data.branchId) : null,
        slug,
        category: data.category || 'workspace',
        requiresSeats: data.requiresSeats || 'required',
        requiresDate: data.requiresDate || 'required',
        pricingUnit: data.pricingUnit || 'month',
        shortDescription: data.shortDescription || '',
        detailedDescription:
          data.fullDescription || data.detailedDescription || '',
        startingPrice: Number(data.startingPrice || 0),
        iconClass: data.icon || data.iconClass || 'Building2',
        featuredImage:
          data.imageUrl ||
          data.featuredImage ||
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        galleryImages: galleryImages
          ? JSON.parse(JSON.stringify(galleryImages))
          : null,
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
        ? data.galleryImagesText
            .split('\n')
            .map((u: string) => u.trim())
            .filter((u: string) => u.length > 0)
        : undefined;

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.branchId !== undefined
          ? { branchId: data.branchId ? Number(data.branchId) : null }
          : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.requiresSeats ? { requiresSeats: data.requiresSeats } : {}),
        ...(data.requiresDate ? { requiresDate: data.requiresDate } : {}),
        ...(data.pricingUnit ? { pricingUnit: data.pricingUnit } : {}),
        ...(data.shortDescription !== undefined
          ? { shortDescription: data.shortDescription }
          : {}),
        ...(data.fullDescription !== undefined ||
        data.detailedDescription !== undefined
          ? {
              detailedDescription:
                data.fullDescription || data.detailedDescription,
            }
          : {}),
        ...(data.startingPrice !== undefined
          ? { startingPrice: Number(data.startingPrice) }
          : {}),
        ...(data.icon || data.iconClass
          ? { iconClass: data.icon || data.iconClass }
          : {}),
        ...(data.imageUrl || data.featuredImage
          ? { featuredImage: data.imageUrl || data.featuredImage }
          : {}),
        ...(galleryImages !== undefined
          ? { galleryImages: JSON.parse(JSON.stringify(galleryImages)) }
          : {}),
        ...(data.isActive !== undefined
          ? { isActive: Boolean(data.isActive) }
          : {}),
        ...(data.sortOrder !== undefined
          ? { sortOrder: Number(data.sortOrder) }
          : {}),
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

  async findAllInquiries(branchId?: number, category?: string) {
    const whereClause: any = {
      OR: [
        { serviceId: { not: null } },
        { bookingCode: { startsWith: 'SRV-' } },
        { notes: { contains: 'Service:' } },
        { notes: { contains: 'Solution:' } },
      ],
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    if (category && category !== 'all') {
      whereClause.OR = [
        { service: { category } },
        { notes: { contains: `CATEGORY: ${category.toUpperCase()}` } },
      ];
    }

    const inquiries = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        branch: true,
        service: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      inquiries,
    };
  }

  async updateInquiryStatus(
    id: number,
    status?: BookingStatus,
    totalAmount?: number,
    paymentStatus?: PaymentStatus,
  ) {
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
      await this.sendInquiryMessage(
        id,
        'system',
        'System Notification',
        sysText.trim(),
      );
    }

    this.chatGateway.notifyInquiryUpdate(id, 'status_change', updated);

    if (this.notificationsService) {
      this.notificationsService
        .createNotification(
          (updated as any).userId || null,
          totalAmount !== undefined
            ? 'Custom Quote Update'
            : 'Solution Inquiry Update',
          totalAmount !== undefined
            ? `Center manager updated your corporate team inquiry quote to ₹${Number(totalAmount).toLocaleString()}.`
            : `Center manager updated your corporate team inquiry status to '${status}'.`,
          'inquiry',
          '/dashboard',
        )
        .catch(() => {});
    }

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
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Inquiry not found');
    }

    if (
      booking.paymentStatus === PaymentStatus.paid &&
      senderType !== 'system'
    ) {
      throw new BadRequestException(
        'Discussion is closed for this inquiry as payment has been completed.',
      );
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
