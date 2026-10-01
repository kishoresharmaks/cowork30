import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContactStatus } from '@prisma/client';

const DEFAULT_TOPUP_PACKAGES = [
  {
    id: '1',
    amount: 1000,
    bonus: 0,
    title: 'Starter Credit Pack',
    badge: 'Basic',
    isPopular: false,
  },
  {
    id: '2',
    amount: 2500,
    bonus: 250,
    title: 'Most Popular Value Pack',
    badge: 'Best Value',
    isPopular: true,
  },
  {
    id: '3',
    amount: 5000,
    bonus: 750,
    title: 'Pro Team Pack',
    badge: 'Max Savings',
    isPopular: false,
  },
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

    const taxRateSetting = await this.prisma.siteSetting.findUnique({
      where: { key: 'tax_rate' },
    });
    const taxRate =
      taxRateSetting && !isNaN(Number(taxRateSetting.value))
        ? Number(taxRateSetting.value)
        : 0.18;

    return {
      success: true,
      welcomeBonusAmount:
        welcomeBonus && !isNaN(Number(welcomeBonus.value))
          ? Number(welcomeBonus.value)
          : 500.0,
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
        create: {
          key: 'wallet_topup_packages',
          value: JSON.stringify(body.topupPackages),
        },
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

  async submitContact(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) {
    if (!data.name || !data.email || !data.message) {
      throw new BadRequestException(
        'Name, email, and message are required fields.',
      );
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
        subject: data.subject
          ? String(data.subject).trim().slice(0, 200)
          : null,
        message: String(data.message).trim().slice(0, 5000),
        status: ContactStatus.unread,
      },
    });

    return {
      success: true,
      message:
        'Your message has been received. We will get back to you within 24 hours.',
      contactId: contact.id,
    };
  }

  // --- BLOG MODULE METHODS ---
  private async ensureSampleBlogsExist() {
    const count = await this.prisma.blogPost.count();
    if (count > 0) return;

    const samplePosts = [
      {
        title: 'The Future of Hybrid Coworking: Trends Shaping Workspaces in 2026',
        slug: 'the-future-of-hybrid-coworking-2026',
        shortDescription:
          'Discover how modern flexible workspaces are combining high-speed fiber internet, acoustic pods, and community hubs to power high-performing remote teams.',
        featuredImage:
          'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
        content:
          '<h2>The Evolution of Modern Workspaces</h2><p>As hybrid work models become the standard for tech startups and enterprises alike, professional coworking spaces are evolving far beyond simple shared desks.</p><p>Today\'s teams demand ergonomic infrastructure, seamless biometric access, high-speed 1Gbps fiber connectivity, and quiet executive suites for confidential client calls.</p><h3>Key Advantages of Flexible Workspaces</h3><ul><li>Zero long-term real estate lock-in</li><li>Instant scalability for expanding teams</li><li>All-inclusive amenities: gourmet espresso, meeting credits, and GST tax invoicing</li></ul>',
        category: 'Coworking Trends',
        status: 'published',
        authorName: 'Cowork30 Editorial Team',
        readTime: '4 min read',
        publishedAt: new Date(),
      },
      {
        title: '10 Proven Strategies for Maximizing Focus in a Shared Workspace',
        slug: '10-proven-strategies-for-maximizing-focus',
        shortDescription:
          'Learn how to leverage soundproof booths, structured time slots, and ergonomic lounge zones to double your daily work output.',
        featuredImage:
          'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80',
        content:
          '<h2>Mastering Deep Work in Coworking Environments</h2><p>Working in a vibrant community environment provides immense networking energy, but deep focus requires intentional daily routines.</p><h3>1. Leverage Dedicated Quiet Zones</h3><p>When working on complex code or financial modeling, step into soundproof phone booths or dedicated quiet zones.</p><h3>2. Block Out Focus Hours</h3><p>Use noise-canceling headphones during your morning deep work block, and save community lounge hours for afternoon coffee and collaboration.</p>',
        category: 'Productivity',
        status: 'published',
        authorName: 'Alex Rivers, Workplace Strategist',
        readTime: '5 min read',
        publishedAt: new Date(Date.now() - 86400000),
      },
      {
        title: 'How Virtual Offices Help Startups Build Instant Corporate Credibility',
        slug: 'how-virtual-offices-help-startups-build-credibility',
        shortDescription:
          'Everything you need to know about official GST registration, MCA compliance, and receiving business mail with a prime commercial address.',
        featuredImage:
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        content:
          '<h2>Building Trust from Day One</h2><p>For early-stage startups and independent consultants, registering a business under a prime commercial address creates immediate trust with clients and enterprise partners.</p><h3>Why Virtual Offices Are Essential for Modern Founders</h3><p>With official GST documentation, digital mail scanning, and on-demand access to boardrooms, virtual offices give founders enterprise presence at a fraction of traditional lease costs.</p>',
        category: 'Startup Guides',
        status: 'published',
        authorName: 'Sarah Lin, Startup Advisor',
        readTime: '3 min read',
        publishedAt: new Date(Date.now() - 172800000),
      },
    ];

    for (const post of samplePosts) {
      await this.prisma.blogPost.create({ data: post });
    }
  }

  async getPublicBlogs(category?: string, search?: string) {
    await this.ensureSampleBlogsExist();

    const whereClause: any = {
      status: 'published',
    };

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (search && search.trim()) {
      const query = search.trim();
      whereClause.OR = [
        { title: { contains: query } },
        { shortDescription: { contains: query } },
        { category: { contains: query } },
      ];
    }

    const posts = await this.prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const categoriesList = await this.prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = ['All', ...categoriesList.map((c) => c.category)];

    return {
      success: true,
      posts,
      categories,
    };
  }

  async getBlogBySlug(identifier: string) {
    await this.ensureSampleBlogsExist();

    const isId = !isNaN(Number(identifier));
    let post = null;

    if (isId) {
      post = await this.prisma.blogPost.findUnique({
        where: { id: Number(identifier) },
      });
    }

    if (!post) {
      post = await this.prisma.blogPost.findUnique({
        where: { slug: identifier },
      });
    }

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const related = await this.prisma.blogPost.findMany({
      where: {
        status: 'published',
        id: { not: post.id },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      post,
      related,
    };
  }

  async getAdminBlogs() {
    await this.ensureSampleBlogsExist();

    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      posts,
    };
  }

  async createBlog(data: any) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestException('Blog Title is required.');
    }
    if (!data.shortDescription || !data.shortDescription.trim()) {
      throw new BadRequestException('Blog Description is required.');
    }
    if (!data.content || !data.content.trim()) {
      throw new BadRequestException('Blog Content is required.');
    }

    const title = data.title.trim();
    let slug =
      data.slug && data.slug.trim()
        ? data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existingSlug = await this.prisma.blogPost.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const status = data.status === 'published' ? 'published' : 'draft';
    const wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const post = await this.prisma.blogPost.create({
      data: {
        title,
        slug,
        shortDescription: data.shortDescription.trim(),
        featuredImage:
          data.featuredImage ||
          'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
        content: data.content,
        category: data.category?.trim() || 'Coworking',
        status,
        authorName: data.authorName?.trim() || 'Cowork30 Team',
        readTime,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    return {
      success: true,
      message: `Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully.`,
      post,
    };
  }

  async updateBlog(id: number, data: any) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    const status = data.status ? (data.status === 'published' ? 'published' : 'draft') : existing.status;
    let publishedAt = existing.publishedAt;
    if (status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const conflict = await this.prisma.blogPost.findFirst({
        where: { slug, id: { not: id } },
      });
      if (conflict) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    let readTime = existing.readTime;
    if (data.content) {
      const wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    }

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim(), slug } : {}),
        ...(data.shortDescription ? { shortDescription: data.shortDescription.trim() } : {}),
        ...(data.featuredImage !== undefined ? { featuredImage: data.featuredImage } : {}),
        ...(data.content ? { content: data.content, readTime } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        status,
        publishedAt,
        ...(data.authorName ? { authorName: data.authorName.trim() } : {}),
      },
    });

    return {
      success: true,
      message: `Blog post ${status === 'published' ? 'published' : 'updated'} successfully.`,
      post: updated,
    };
  }

  async deleteBlog(id: number) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.delete({ where: { id } });
    return {
      success: true,
      message: 'Blog post deleted successfully',
    };
  }
}
