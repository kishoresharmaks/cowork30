import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private prisma: PrismaService) {}

  private async getTaxRate(): Promise<number> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: 'tax_rate' } });
    const rate = setting && !isNaN(Number(setting.value)) ? Number(setting.value) : 0.18;
    return rate;
  }

  private async getSellerDetails() {
    const siteInfoSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'site_info' } });
    let siteInfo: any = {};
    if (siteInfoSetting && siteInfoSetting.value) {
      try {
        siteInfo = JSON.parse(siteInfoSetting.value);
      } catch (e) {}
    }

    return {
      companyName: siteInfo.companyName || 'Enterprise Workspace Solutions Pvt. Ltd.',
      companyAddress: siteInfo.companyAddress || 'A-39, Downtown Hub, New Delhi, India',
      companyGstin: siteInfo.companyGstin || '07AAAAA0000A1Z5',
      sacCode: siteInfo.sacCode || '997212',
    };
  }

  async generateInvoice(params: {
    paymentId: number;
    userId?: number;
    customerName: string;
    customerGstin?: string;
    companyName?: string;
    subtotal: number;
    taxAmount?: number;
    isTaxable?: boolean;
  }) {
    const { paymentId, userId, customerName, customerGstin, companyName, isTaxable = false } = params;

    const invoiceNumber = `INV-2026-${Date.now().toString(36).toUpperCase()}`;
    const paidAmount = Number(params.subtotal || 0);

    let netSubtotal = paidAmount;
    let halfTax = 0;
    let grandTotal = paidAmount;

    if (isTaxable) {
      const taxRate = await this.getTaxRate();
      netSubtotal = Number((paidAmount / (1 + taxRate)).toFixed(2));
      const totalTax = Number((paidAmount - netSubtotal).toFixed(2));
      halfTax = Number((totalTax / 2).toFixed(2));
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        paymentId,
        userId: userId || null,
        customerName,
        customerGstin: customerGstin || null,
        companyName: companyName || null,
        subtotal: netSubtotal,
        cgst: halfTax,
        sgst: halfTax,
        igst: 0.00,
        totalAmount: grandTotal,
        pdfUrl: `/api/v1/wallet/invoices/${invoiceNumber}/pdf`,
      },
    });

    this.logger.log(`Generated Invoice #${invoice.invoiceNumber} for Payment #${paymentId} (Grand Total: ₹${grandTotal}, Taxable: ${isTaxable})`);
    return invoice;
  }

  async getInvoiceHtml(invoiceNumber: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        user: true,
        payment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice #${invoiceNumber} not found`);
    }

    const seller = await this.getSellerDetails();
    const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const isTopup = !invoice.payment?.bookingId && !invoice.payment?.meetingBookingId;
    const isTaxable = !isTopup && (Number(invoice.cgst) > 0 || Number(invoice.sgst) > 0);

    let grandTotalNum = Number(invoice.totalAmount);
    let subtotalNum = isTaxable ? Number(invoice.subtotal) : grandTotalNum;
    let cgstNum = isTaxable ? Number(invoice.cgst) : 0;
    let sgstNum = isTaxable ? Number(invoice.sgst) : 0;
    let totalTaxNum = isTaxable ? (cgstNum + sgstNum) : 0;

    const subtotal = subtotalNum.toFixed(2);
    const cgst = cgstNum.toFixed(2);
    const sgst = sgstNum.toFixed(2);
    const totalTax = totalTaxNum.toFixed(2);
    const totalAmount = grandTotalNum.toFixed(2);

    const documentHeaderTitle = isTopup ? 'CREDIT WALLET RECHARGE RECEIPT' : 'GST TAX INVOICE';
    const serviceTitle = isTopup
      ? 'Cowork30 Wallet Credit Recharge (Advance Stored Value Deposit)'
      : 'Coworking Space Reservation / Membership Services';

    const sacNote = isTopup
      ? 'SAC/HSN Code: 997159 - Stored Value Deposit (0% Tax / Non-Taxable Wallet Recharge)'
      : `SAC/HSN Code: ${seller.sacCode} - Rental / Coworking Space Services (18% GST)`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentHeaderTitle} - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 26px; font-weight: 900; color: #7c3aed; }
    .inv-title { font-size: 18px; font-weight: 800; text-align: right; color: #1e293b; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; font-size: 13px; }
    .box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .box h4 { margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 12px; font-weight: 700; color: #475569; }
    td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; }
    .summary { width: 300px; margin-left: auto; font-size: 13px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 900; color: #059669; border-top: 2px solid #059669; margin-top: 8px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .btn-print { background: #7c3aed; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; margin-bottom: 20px; }
    @media print { .btn-print { display: none; } body { padding: 0; background: #fff; } .container { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 800px; margin: 0 auto;">
    <button onclick="window.print()" class="btn-print">🖨️ Print / Save as PDF</button>
  </div>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">${seller.companyName}</div>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${seller.companyAddress}<br>GSTIN: <span style="font-family: monospace; font-weight: 700; color: #334155;">${seller.companyGstin}</span></p>
      </div>
      <div class="inv-title">
        ${documentHeaderTitle}
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #6366f1; font-family: monospace;">#${invoice.invoiceNumber}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: normal;">Date: ${dateStr}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="box">
        <h4>Billed To (Customer Details)</h4>
        <p style="margin:0; font-weight:800; font-size: 14px;">${invoice.customerName}</p>
        <p style="margin:4px 0 0 0;">Company: ${invoice.companyName || invoice.user?.companyName || 'N/A'}</p>
        <p style="margin:4px 0 0 0;">GSTIN: <span style="font-family: monospace; font-weight: 700;">${invoice.customerGstin || invoice.user?.gstin || 'Standard B2C'}</span></p>
        <p style="margin:4px 0 0 0;">Email: ${invoice.user?.email || 'N/A'}</p>
      </div>
      <div class="box">
        <h4>Payment Reference</h4>
        <p style="margin:0; font-weight:800;">Payment ID: #${invoice.paymentId}</p>
        <p style="margin:4px 0 0 0;">Status: <span style="color:#059669; font-weight:800;">PAID & VERIFIED</span></p>
        <p style="margin:4px 0 0 0;">Currency: INR (₹)</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${serviceTitle}</strong>
            <p style="margin:4px 0 0 0; font-size:11px; color:#64748b;">${sacNote}</p>
          </td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">₹${subtotal}</td>
          <td style="text-align: right; font-weight:700;">₹${subtotal}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal Amount:</span>
        <strong>₹${subtotal}</strong>
      </div>
      <div class="summary-row">
        <span>CGST (${isTaxable ? '9%' : '0%'}):</span>
        <span>₹${cgst}</span>
      </div>
      <div class="summary-row">
        <span>SGST (${isTaxable ? '9%' : '0%'}):</span>
        <span>₹${sgst}</span>
      </div>
      <div class="summary-row" style="padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
        <span>Total Tax (${isTaxable ? '18% GST' : '0% Tax'}):</span>
        <strong>₹${totalTax}</strong>
      </div>
      <div class="total-row">
        <span>Grand Total Paid:</span>
        <span>₹${totalAmount}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated receipt issued for ₹${totalAmount} paid transaction. No signature required.</p>
      <p>© 2026 ${seller.companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
