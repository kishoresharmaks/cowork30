import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContactStatus } from '@prisma/client';

const DEFAULT_TOPUP_PACKAGES = [
  { id: '1', amount: 1000, bonus: 0, title: 'Starter Credit Pack', badge: 'Basic', isPopular: false },
  { id: '2', amount: 2500, bonus: 250, title: 'Most Popular Value Pack', badge: 'Best Value', isPopular: true },
  { id: '3', amount: 5000, bonus: 750, title: 'Pro Team Pack', badge: 'Max Savings', isPopular: false },
];

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getHomepageData() {
    const slides = await this.prisma.slide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    });

    const plans = await this.prisma.pricingPlan.findMany({
      where: { isActive: true },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    const gallery = await this.prisma.gallery.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
    });

    const siteInfo = await this.prisma.siteSetting.findUnique({
      where: { key: 'site_info' },
    });

    const logo = await this.prisma.logoSetting.findFirst({
      where: { isActive: true },
    });

    return {
      success: true,
      slides,
      services,
      plans,
      gallery,
      siteSettings: siteInfo ? JSON.parse(siteInfo.value) : {},
      logo,
    };
  }

  async getSettings() {
    const welcomeBonus = await this.prisma.siteSetting.findUnique({
      where: { key: 'welcome_bonus_amount' },
    });
    const siteInfo = await this.prisma.siteSetting.findUnique({
      where: { key: 'site_info' },
    });
    const topupPacksSetting = await this.prisma.siteSetting.findUnique({
      where: { key: 'wallet_topup_packages' },
    });

    let topupPackages = DEFAULT_TOPUP_PACKAGES;
    if (topupPacksSetting && topupPacksSetting.value) {
      try {
        topupPackages = JSON.parse(topupPacksSetting.value);
      } catch (e) {}
    }

    const taxRateSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const taxRate = taxRateSetting && !isNaN(Number(taxRateSetting.value)) ? Number(taxRateSetting.value) : 0.18;

    return {
      success: true,
      welcomeBonusAmount: welcomeBonus && !isNaN(Number(welcomeBonus.value)) ? Number(welcomeBonus.value) : 500.00,
      siteInfo: siteInfo ? JSON.parse(siteInfo.value) : {},
      topupPackages,
      taxRate,
    };
  }

  async updateSettings(body: any) {
    if (body.welcomeBonusAmount !== undefined) {
      const val = Number(body.welcomeBonusAmount);
      await this.prisma.siteSetting.upsert({
        where: { key: 'welcome_bonus_amount' },
        update: { value: val.toString() },
        create: { key: 'welcome_bonus_amount', value: val.toString() },
      });
    }

    if (body.siteInfo) {
      await this.prisma.siteSetting.upsert({
        where: { key: 'site_info' },
        update: { value: JSON.stringify(body.siteInfo) },
        create: { key: 'site_info', value: JSON.stringify(body.siteInfo) },
      });
    }

    if (body.topupPackages && Array.isArray(body.topupPackages)) {
      await this.prisma.siteSetting.upsert({
        where: { key: 'wallet_topup_packages' },
        update: { value: JSON.stringify(body.topupPackages) },
        create: { key: 'wallet_topup_packages', value: JSON.stringify(body.topupPackages) },
      });
    }

    if (body.taxRate !== undefined) {
      const val = Number(body.taxRate);
      if (!isNaN(val) && val >= 0) {
        await this.prisma.siteSetting.upsert({
          where: { key: 'tax_rate' },
          update: { value: val.toString() },
          create: { key: 'tax_rate', value: val.toString() },
        });
      }
    }

    return this.getSettings();
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page || !page.isActive) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async getNavigationItems() {
    return this.prisma.navigationMenuItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getGallery(category?: any) {
    return this.prisma.gallery.findMany({
      where: {
        ...(category ? { category } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addGalleryItem(data: any) {
    const item = await this.prisma.gallery.create({
      data: {
        title: data.title,
        category: data.category || 'workspaces',
        imageUrl: data.imageUrl,
        isActive: true,
        sortOrder: 1,
      },
    });

    return {
      success: true,
      item,
    };
  }

  async deleteGalleryItem(id: number) {
    await this.prisma.gallery.delete({ where: { id } });
    return {
      success: true,
      message: 'Photo deleted from gallery',
    };
  }

  async submitContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    if (!data.name || !data.email || !data.message) {
      throw new BadRequestException('Name, email, and message are required fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    if (data.message.length > 5000) {
      throw new BadRequestException('Message must be under 5000 characters.');
    }

    const contact = await this.prisma.contact.create({
      data: {
        name: String(data.name).trim().slice(0, 100),
        email: String(data.email).trim().toLowerCase().slice(0, 100),
        phone: data.phone ? String(data.phone).trim().slice(0, 20) : null,
        subject: data.subject ? String(data.subject).trim().slice(0, 200) : null,
        message: String(data.message).trim().slice(0, 5000),
        status: ContactStatus.unread,
      },
    });

    return {
      success: true,
      message: 'Your message has been received. We will get back to you within 24 hours.',
      contactId: contact.id,
    };
  }
}
