/** Navigate to invoice page and optionally auto-download PDF. */
export function openInvoicePage(bookingId: string, autoDownload = true) {
  const qs = autoDownload ? '?download=1' : '';
  window.open(`/invoice/${bookingId}${qs}`, '_blank', 'noopener,noreferrer');
}
