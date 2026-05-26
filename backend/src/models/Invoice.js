import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      amount: Number,
    }],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    currency: { type: String, default: 'INR' },
    pdfUrl: String,
    securityDeposit: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    depositRefunded: { type: Number, default: 0 },
    additionalDue: { type: Number, default: 0 },
    isFinal: { type: Boolean, default: false },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ user: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
