import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PDF_ROOT = path.resolve(__dirname, '../../../../apps/web/public/assets/invoices');

const ensureDir = () => fs.mkdirSync(PDF_ROOT, { recursive: true });

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const formatDate = (d) => (d ? new Date(d).toLocaleString('en-IN') : '-');

const writePdf = (filename, buildFn) =>
  new Promise((resolve, reject) => {
    ensureDir();
    const filePath = path.join(PDF_ROOT, filename);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    buildFn(doc);
    doc.end();
    stream.on('finish', () => resolve(`/assets/invoices/${filename}`));
    stream.on('error', reject);
  });

class PdfService {
  async generateBookingSummary(booking) {
    const filename = `booking-${booking.bookingNumber}-${Date.now()}.pdf`;
    const user = booking.user;
    const vehicle = booking.vehicle;
    const pricing = booking.pricing || {};

    const url = await writePdf(filename, (doc) => {
      doc.fontSize(20).text('VelocityRent — Booking Summary', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Booking #: ${booking.bookingNumber}`);
      doc.text(`Status: ${booking.status.toUpperCase()}`);
      doc.text(`Generated: ${formatDate(new Date())}`);
      doc.moveDown();

      doc.fontSize(14).text('Customer Details', { underline: true });
      doc.fontSize(11);
      doc.text(`Name: ${user?.firstName || ''} ${user?.lastName || ''}`);
      doc.text(`Email: ${user?.email || '-'}`);
      doc.text(`Phone: ${user?.phone || '-'}`);
      if (booking.onboarding?.aadharNumber) doc.text(`Aadhar: ${booking.onboarding.aadharNumber}`);
      if (booking.onboarding?.licenseNumber) doc.text(`License: ${booking.onboarding.licenseNumber}`);
      doc.moveDown();

      doc.fontSize(14).text('Vehicle Details', { underline: true });
      doc.fontSize(11);
      doc.text(`Vehicle: ${vehicle?.name || '-'}`);
      doc.text(`Type: ${vehicle?.type || '-'}`);
      doc.text(`Registration: ${vehicle?.registrationNumber || '-'}`);
      doc.text(`Pickup: ${booking.pickupLocation?.hub || '-'}`);
      doc.moveDown();

      doc.fontSize(14).text('Rental Period', { underline: true });
      doc.fontSize(11);
      doc.text(`Start: ${formatDate(booking.startDate)}`);
      doc.text(`End: ${formatDate(booking.endDate)}`);
      doc.moveDown();

      doc.fontSize(14).text('Pricing Breakdown', { underline: true });
      doc.fontSize(11);
      doc.text(`Base Amount: ${formatCurrency(pricing.baseAmount)}`);
      doc.text(`Tax/GST: ${formatCurrency(pricing.tax)}`);
      doc.text(`Discount: ${formatCurrency(pricing.discount || 0)}`);
      doc.text(`Coupon Discount: ${formatCurrency(pricing.couponDiscount || 0)}`);
      doc.text(`Security Deposit: ${formatCurrency(pricing.securityDeposit)}`);
      doc.text(`Late Fee: ${formatCurrency(pricing.lateFee || 0)}`);
      doc.moveDown();
      doc.fontSize(13).text(`Total Paid: ${formatCurrency(pricing.totalAmount)}`, { bold: true });
    });

    return url;
  }

  async generateFinalInvoice(booking, invoice) {
    const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    const user = booking.user;
    const vehicle = booking.vehicle;
    const pricing = booking.pricing || {};
    const settlement = booking.settlement || {};
    const inspection = booking.returnInspection || {};

    const url = await writePdf(filename, (doc) => {
      doc.fontSize(20).text('VelocityRent — Tax Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
      doc.text(`Booking #: ${booking.bookingNumber}`);
      doc.text(`Date: ${formatDate(invoice.issuedAt || new Date())}`);
      doc.moveDown();

      doc.fontSize(14).text('Bill To', { underline: true });
      doc.fontSize(11);
      doc.text(`${user?.firstName || ''} ${user?.lastName || ''}`);
      doc.text(`${user?.email || ''}`);
      doc.text(`${user?.phone || ''}`);
      doc.moveDown();

      doc.fontSize(14).text('Vehicle', { underline: true });
      doc.fontSize(11);
      doc.text(`${vehicle?.name} (${vehicle?.registrationNumber})`);
      doc.text(`Rental: ${formatDate(booking.startDate)} — ${formatDate(booking.actualReturnDate || booking.endDate)}`);
      doc.moveDown();

      doc.fontSize(14).text('Charges', { underline: true });
      doc.fontSize(11);
      doc.text(`Rental Amount: ${formatCurrency(settlement.rentalAmount ?? pricing.baseAmount)}`);
      doc.text(`Tax/GST: ${formatCurrency(settlement.tax ?? pricing.tax)}`);
      doc.text(`Late Fee: ${formatCurrency(pricing.lateFee || 0)}`);
      doc.text(`Total Rental: ${formatCurrency(pricing.totalAmount - (pricing.securityDeposit || 0))}`);
      doc.moveDown();

      doc.fontSize(14).text('Security Deposit Settlement', { underline: true });
      doc.fontSize(11);
      doc.text(`Security Deposit Held: ${formatCurrency(settlement.securityDeposit ?? pricing.securityDeposit)}`);

      if (inspection.checklist?.length) {
        doc.moveDown();
        doc.text('Return Inspection:');
        inspection.checklist.forEach((item) => {
          const status = item.passed ? 'OK' : `FAILED — Repair: ${formatCurrency(item.repairCost)}`;
          doc.text(`  • ${item.label}: ${status}`);
        });
      }

      doc.text(`Total Deductions: ${formatCurrency(settlement.totalDeductions ?? inspection.totalDeductions)}`);
      doc.text(`Deposit Refunded: ${formatCurrency(settlement.depositRefunded ?? inspection.depositRefund)}`);

      const additionalDue = settlement.additionalDue ?? inspection.additionalDue ?? 0;
      if (additionalDue > 0) {
        doc.fillColor('red').text(`Additional Amount Due (exceeds deposit): ${formatCurrency(additionalDue)}`);
        doc.fillColor('black');
      }

      doc.moveDown();
      doc.fontSize(13).text(`Grand Total: ${formatCurrency(invoice.total)}`, { bold: true });
      doc.fontSize(10).text('Thank you for choosing VelocityRent!');
    });

    return url;
  }
}

export default new PdfService();
