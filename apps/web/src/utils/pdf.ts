/** Open a PDF served from the Next.js public folder or absolute URL. */
export function openPdfUrl(pdfUrl: string) {
  if (!pdfUrl) return;
  const url = pdfUrl.startsWith('http') ? pdfUrl : `${window.location.origin}${pdfUrl}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
