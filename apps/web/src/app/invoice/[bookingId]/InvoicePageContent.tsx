'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { InvoiceDocument, InvoiceData } from '@/components/invoice/InvoiceDocument';
import { bookingService } from '@/services';
import { useAuthReady } from '@/hooks/useAuthReady';
import { downloadElementAsPdf } from '@/lib/downloadInvoicePdf';

export default function InvoicePageContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ready, isAuthed } = useAuthReady();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [autoDone, setAutoDone] = useState(false);
  const autoDownload = searchParams.get('download') === '1';

  useEffect(() => {
    if (ready && !isAuthed) router.push('/login');
  }, [ready, isAuthed, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoice-data', bookingId],
    queryFn: () => bookingService.getInvoiceData(bookingId).then((r) => r.data.data as InvoiceData),
    enabled: !!bookingId && ready && isAuthed,
  });

  const handleDownload = async () => {
    if (!invoiceRef.current || !data) return;
    setDownloading(true);
    try {
      const label = data.type === 'final' ? 'invoice' : 'receipt';
      await downloadElementAsPdf(
        invoiceRef.current,
        `VelocityRent-${data.booking.bookingNumber}-${label}.pdf`
      );
    } catch {
      alert('Failed to generate PDF. Try Print instead.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload && data && invoiceRef.current && !downloading && !autoDone) {
      setAutoDone(true);
      handleDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, data, autoDone]);

  if (!ready || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen pt-16">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Invoice not available for this booking.</p>
          <Link href="/dashboard/bookings"><Button>Back to Bookings</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 pt-16 pb-12">
        <Navbar />

        <div className="no-print container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/dashboard/bookings/${bookingId}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </div>

        <div id="invoice-print-area" ref={invoiceRef} className="container mx-auto px-4">
          <InvoiceDocument data={data} />
        </div>
      </main>
    </>
  );
}
