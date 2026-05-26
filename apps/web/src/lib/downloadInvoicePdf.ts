import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/** Capture an HTML element as a multi-page PDF download. */
export async function downloadElementAsPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const imgHeight = (canvas.height * contentWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgHeight - heightLeft);
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export async function downloadInvoiceByBookingId(
  bookingId: string,
  bookingNumber: string,
  getElement: () => HTMLElement | null
) {
  const el = getElement();
  if (!el) throw new Error('Invoice not ready');
  await downloadElementAsPdf(el, `VelocityRent-${bookingNumber}-invoice.pdf`);
}
