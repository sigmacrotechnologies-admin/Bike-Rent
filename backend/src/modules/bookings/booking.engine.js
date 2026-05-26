export const calculatePricing = (vehicle, startDate, endDate, coupon = null) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end - start;
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  let rateType = 'hourly';
  let rateApplied = vehicle.pricing.hourly;
  let baseAmount = vehicle.pricing.hourly * durationHours;

  if (durationDays >= 30 && vehicle.pricing.monthly) {
    rateType = 'monthly';
    rateApplied = vehicle.pricing.monthly;
    baseAmount = vehicle.pricing.monthly * Math.ceil(durationDays / 30);
  } else if (durationDays >= 7 && vehicle.pricing.weekly) {
    rateType = 'weekly';
    rateApplied = vehicle.pricing.weekly;
    baseAmount = vehicle.pricing.weekly * Math.ceil(durationDays / 7);
  } else if (durationDays >= 1) {
    rateType = 'daily';
    rateApplied = vehicle.pricing.daily;
    baseAmount = vehicle.pricing.daily * durationDays;
  }

  const dynamicMultiplier = vehicle.dynamicPricingMultiplier || 1;
  baseAmount = Math.round(baseAmount * dynamicMultiplier);

  let couponDiscount = 0;
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      couponDiscount = Math.round((baseAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
    } else {
      couponDiscount = coupon.discountValue;
    }
  }

  const subtotal = baseAmount - couponDiscount;
  const tax = Math.round(subtotal * 0.18);
  const securityDeposit = vehicle.pricing.securityDeposit || 0;
  const totalAmount = subtotal + tax + securityDeposit;

  return {
    baseAmount,
    durationHours,
    rateType,
    rateApplied,
    dynamicMultiplier,
    discount: 0,
    couponDiscount,
    tax,
    securityDeposit,
    lateFee: 0,
    totalAmount,
  };
};

/** Rental charge for an extension period — excludes security deposit */
export const calculateExtensionPricing = (vehicle, extensionStart, extensionEnd) => {
  const pricing = calculatePricing(vehicle, extensionStart, extensionEnd);
  const chargeAmount = pricing.baseAmount + pricing.tax;

  return {
    baseAmount: pricing.baseAmount,
    durationHours: pricing.durationHours,
    rateType: pricing.rateType,
    rateApplied: pricing.rateApplied,
    tax: pricing.tax,
    chargeAmount,
  };
};

export const generateBookingNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VR-${timestamp}-${random}`;
};

export const calculateRefund = (booking, cancelledAt = new Date()) => {
  const start = new Date(booking.startDate);
  const hoursUntilStart = (start - cancelledAt) / (1000 * 60 * 60);
  const totalPaid = booking.pricing?.totalAmount || 0;

  if (hoursUntilStart >= 48) return { refundAmount: totalPaid, refundPercent: 100 };
  if (hoursUntilStart >= 24) return { refundAmount: Math.round(totalPaid * 0.75), refundPercent: 75 };
  if (hoursUntilStart >= 12) return { refundAmount: Math.round(totalPaid * 0.50), refundPercent: 50 };
  return { refundAmount: Math.round(totalPaid * 0.25), refundPercent: 25 };
};
