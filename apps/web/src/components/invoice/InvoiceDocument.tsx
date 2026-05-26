'use client';

import { formatCurrency, formatDateTime } from '@/utils/cn';

export interface InvoiceData {
  type: 'receipt' | 'final';
  invoiceNumber: string;
  issuedAt: string;
  booking: {
    bookingNumber: string;
    status: string;
    startDate: string;
    endDate: string;
    actualReturnDate?: string;
    pickupLocation?: { hub?: string; address?: string; city?: string };
    extensionCount?: number;
  };
  extensions?: Array<{
    previousEndDate: string;
    newEndDate: string;
    baseAmount: number;
    tax: number;
    chargeAmount: number;
    paidAt: string;
  }>;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    address?: { street?: string; city?: string; state?: string; zipCode?: string };
  };
  vehicle: {
    name?: string;
    type?: string;
    registrationNumber?: string;
  };
  payment?: {
    amount?: number;
    status?: string;
    provider?: string;
    providerPaymentId?: string;
    paidAt?: string;
  } | null;
  coupon?: {
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    discountApplied?: number;
  } | null;
  breakdown: {
    baseAmount: number;
    rateType?: string;
    rateApplied?: number;
    durationHours?: number;
    discount: number;
    couponDiscount: number;
    tax: number;
    securityDeposit: number;
    lateFee: number;
    totalAmount: number;
    rentalSubtotal: number;
    rentalWithTax: number;
    amountPaid: number;
    extensionBaseAmount?: number;
    extensionTax?: number;
    extensionAmount?: number;
    originalBaseAmount?: number;
  };
  settlement?: {
    securityDeposit?: number;
    totalDeductions?: number;
    depositRefunded?: number;
    additionalDue?: number;
    checklist?: Array<{ label: string; passed: boolean; repairCost?: number }>;
  } | null;
}

function formatDuration(hours?: number) {
  if (!hours) return '-';
  if (hours < 24) return `${hours} hour(s)`;
  const days = Math.ceil(hours / 24);
  return `${days} day(s) (${hours} hrs)`;
}

function Row({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? 'font-semibold text-base border-t border-gray-300 pt-2 mt-1' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className={negative ? 'text-red-600' : bold ? 'text-gray-900' : 'text-gray-800'}>{value}</span>
    </div>
  );
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const isFinal = data.type === 'final';
  const b = data.breakdown;

  return (
    <div
      id="invoice-document"
      className="mx-auto w-full max-w-[800px] bg-white text-gray-900 p-10 shadow-lg"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">VelocityRent</h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle Rental Platform</p>
          <p className="text-xs text-gray-400 mt-2">GSTIN: 27AABCV1234A1Z5 · Pune, Maharashtra</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold uppercase tracking-wide">
            {isFinal ? 'Tax Invoice' : 'Payment Receipt'}
          </p>
          <p className="text-sm mt-2"><span className="text-gray-500">Invoice #</span> {data.invoiceNumber}</p>
          <p className="text-sm"><span className="text-gray-500">Booking #</span> {data.booking.bookingNumber}</p>
          <p className="text-sm"><span className="text-gray-500">Date</span> {formatDateTime(data.issuedAt)}</p>
          <p className="text-sm"><span className="text-gray-500">Status</span> {data.booking.status.toUpperCase()}</p>
        </div>
      </div>

      {/* Bill To & Vehicle */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-2">Bill To</h2>
          <p className="font-semibold">{data.customer.name}</p>
          <p className="text-sm text-gray-600">{data.customer.email}</p>
          <p className="text-sm text-gray-600">{data.customer.phone}</p>
          {data.customer.address && (
            <p className="text-sm text-gray-600 mt-1">
              {[data.customer.address.street, data.customer.address.city, data.customer.address.state, data.customer.address.zipCode]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-2">Vehicle</h2>
          <p className="font-semibold">{data.vehicle.name}</p>
          <p className="text-sm text-gray-600">Type: {data.vehicle.type} · Reg: {data.vehicle.registrationNumber}</p>
          <p className="text-sm text-gray-600">Pickup: {data.booking.pickupLocation?.hub || '-'}</p>
        </div>
      </div>

      {/* Booking Duration */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">Booking Duration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Start</span><p className="font-medium">{formatDateTime(data.booking.startDate)}</p></div>
          <div><span className="text-gray-500">Scheduled End</span><p className="font-medium">{formatDateTime(data.booking.endDate)}</p></div>
          {data.booking.actualReturnDate && (
            <div><span className="text-gray-500">Actual Return</span><p className="font-medium">{formatDateTime(data.booking.actualReturnDate)}</p></div>
          )}
          <div><span className="text-gray-500">Duration</span><p className="font-medium">{formatDuration(b.durationHours)}</p></div>
          {data.booking.extensionCount ? (
            <div><span className="text-gray-500">Extensions</span><p className="font-medium">{data.booking.extensionCount}</p></div>
          ) : null}
          <div><span className="text-gray-500">Rate</span><p className="font-medium">{formatCurrency(b.rateApplied || 0)} / {b.rateType || 'daily'}</p></div>
        </div>
      </div>

      {/* Payment Details */}
      {data.payment && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">Payment Details</h2>
          <div className="grid grid-cols-2 gap-2 text-sm bg-blue-50 rounded-lg p-4">
            <div><span className="text-gray-500">Method</span><p className="font-medium capitalize">{data.payment.provider}</p></div>
            <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{data.payment.status}</p></div>
            <div><span className="text-gray-500">Transaction ID</span><p className="font-medium text-xs break-all">{data.payment.providerPaymentId || '-'}</p></div>
            <div><span className="text-gray-500">Paid On</span><p className="font-medium">{data.payment.paidAt ? formatDateTime(data.payment.paidAt) : '-'}</p></div>
          </div>
        </div>
      )}

      {/* Coupon */}
      {data.coupon && (
        <div className="mb-6 border border-green-200 bg-green-50 rounded-lg p-4">
          <h2 className="text-xs font-bold uppercase text-green-700 mb-2">Coupon Applied</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Code</span><p className="font-bold text-green-700">{data.coupon.code}</p></div>
            <div><span className="text-gray-500">Discount</span><p className="font-medium">{data.coupon.discountType === 'percentage' ? `${data.coupon.discountValue}%` : formatCurrency(data.coupon.discountValue || 0)}</p></div>
            {data.coupon.description && <div className="col-span-2"><span className="text-gray-500">Description</span><p>{data.coupon.description}</p></div>}
            <div><span className="text-gray-500">Amount Saved</span><p className="font-semibold text-green-700">-{formatCurrency(data.coupon.discountApplied || 0)}</p></div>
          </div>
        </div>
      )}

      {/* Pricing Table */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">Charges Breakdown</h2>
        <div className="border rounded-lg p-4">
          {(b.originalBaseAmount ?? b.baseAmount) > 0 && (
            <Row label="Original Rental" value={formatCurrency(b.originalBaseAmount ?? b.baseAmount)} />
          )}
          {(b.extensionBaseAmount ?? 0) > 0 && (
            <>
              <Row label="Extension Rental" value={formatCurrency(b.extensionBaseAmount || 0)} />
              <Row label="Extension Tax / GST" value={formatCurrency(b.extensionTax || 0)} />
              <Row label="Total Extension Charges" value={formatCurrency(b.extensionAmount || 0)} />
            </>
          )}
          {!(b.extensionBaseAmount ?? 0) && <Row label="Base Rental Amount" value={formatCurrency(b.baseAmount)} />}
          {(b.extensionBaseAmount ?? 0) > 0 && (
            <Row label="Combined Base Rental" value={formatCurrency(b.baseAmount)} />
          )}
          {b.discount > 0 && <Row label="Discount" value={`-${formatCurrency(b.discount)}`} negative />}
          {b.couponDiscount > 0 && <Row label="Coupon Discount" value={`-${formatCurrency(b.couponDiscount)}`} negative />}
          <Row label="Subtotal (after discounts)" value={formatCurrency(b.rentalSubtotal)} />
          <Row label="Tax / GST (18%)" value={formatCurrency(b.tax)} />
          {b.lateFee > 0 && <Row label="Late Fee" value={formatCurrency(b.lateFee)} />}
          <Row label="Rental + Tax" value={formatCurrency(b.rentalWithTax)} />
          <Row label="Security Deposit (Refundable)" value={formatCurrency(b.securityDeposit)} />
          <Row label="Total Amount Paid" value={formatCurrency(b.amountPaid)} bold />
        </div>
      </div>

      {/* Final settlement */}
      {isFinal && data.settlement && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">Security Deposit Settlement</h2>
          <div className="border rounded-lg p-4 bg-amber-50">
            <Row label="Security Deposit Held" value={formatCurrency(data.settlement.securityDeposit || 0)} />
            <Row label="Deductions (repairs/damages)" value={`-${formatCurrency(data.settlement.totalDeductions || 0)}`} negative />
            <Row label="Deposit Refunded to Wallet" value={formatCurrency(data.settlement.depositRefunded || 0)} bold />
            {(data.settlement.additionalDue ?? 0) > 0 && (
              <Row label="Additional Amount Due (exceeds deposit)" value={formatCurrency(data.settlement.additionalDue || 0)} negative />
            )}
          </div>

          {data.settlement.checklist && data.settlement.checklist.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Return Inspection</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2 border">Item</th>
                    <th className="text-center p-2 border">Status</th>
                    <th className="text-right p-2 border">Repair Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.settlement.checklist.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{item.label}</td>
                      <td className="p-2 border text-center">{item.passed ? '✓ OK' : '✗ Issue'}</td>
                      <td className="p-2 border text-right">{item.passed ? '-' : formatCurrency(item.repairCost || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {data.extensions && data.extensions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-3">Extension History</h2>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border">Previous End</th>
                <th className="text-left p-2 border">New End</th>
                <th className="text-right p-2 border">Charge</th>
              </tr>
            </thead>
            <tbody>
              {data.extensions.map((ext, i) => (
                <tr key={i}>
                  <td className="p-2 border">{formatDateTime(ext.previousEndDate)}</td>
                  <td className="p-2 border">{formatDateTime(ext.newEndDate)}</td>
                  <td className="p-2 border text-right">{formatCurrency(ext.chargeAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 mt-6 text-center text-xs text-gray-400">
        <p>This is a computer-generated invoice from VelocityRent.</p>
        <p className="mt-1">For support: support@velocityrent.com · +91 98765 43210</p>
        <p className="mt-1 font-medium text-gray-500">Thank you for choosing VelocityRent!</p>
      </div>
    </div>
  );
}
