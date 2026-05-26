export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];
export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];

export const VEHICLE_TYPES = {
  BIKE: 'bike',
  CAR: 'car',
  EV: 'ev',
  SCOOTER: 'scooter',
};

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
  SOLD: 'sold',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXTENDED: 'extended',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

export const PAYMENT_PROVIDER = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  WALLET: 'wallet',
};

export const WALLET_TX_TYPE = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  TOPUP: 'topup',
  PAYMENT: 'payment',
  REFUND: 'refund',
  ADMIN_ADJUST: 'admin_adjust',
};

export const RETURN_CHECKLIST = {
  bike: [
    { id: 'helmet', label: 'Helmet (with lock)' },
    { id: 'mirrors', label: 'Side mirrors' },
    { id: 'lights', label: 'Indicators & lights' },
    { id: 'tyres', label: 'Tyres condition' },
    { id: 'brakes', label: 'Brakes' },
    { id: 'engine', label: 'Engine / chain condition' },
    { id: 'documents', label: 'Registration documents' },
    { id: 'toolkit', label: 'Tool kit' },
  ],
  car: [
    { id: 'spare_tyre', label: 'Spare tyre & jack' },
    { id: 'ac', label: 'AC working' },
    { id: 'keys', label: 'All keys (main + spare)' },
    { id: 'music', label: 'Music system / infotainment' },
    { id: 'seats', label: 'Seat covers & upholstery' },
    { id: 'documents', label: 'RC, insurance & documents' },
    { id: 'first_aid', label: 'First aid kit' },
    { id: 'lights', label: 'Headlights & indicators' },
    { id: 'tyres', label: 'Tyres condition' },
    { id: 'body', label: 'Body / bumper condition' },
  ],
  ev: [
    { id: 'helmet', label: 'Helmet (with lock)' },
    { id: 'charger', label: 'Charger & cable' },
    { id: 'mirrors', label: 'Side mirrors' },
    { id: 'lights', label: 'Indicators & lights' },
    { id: 'tyres', label: 'Tyres condition' },
    { id: 'brakes', label: 'Brakes' },
    { id: 'battery', label: 'Battery health indicator' },
    { id: 'documents', label: 'Registration documents' },
  ],
  scooter: [
    { id: 'helmet', label: 'Helmet (with lock)' },
    { id: 'mirrors', label: 'Side mirrors' },
    { id: 'lights', label: 'Indicators & lights' },
    { id: 'tyres', label: 'Tyres condition' },
    { id: 'brakes', label: 'Brakes' },
    { id: 'seat', label: 'Seat & storage box' },
    { id: 'documents', label: 'Registration documents' },
    { id: 'toolkit', label: 'Tool kit' },
  ],
};

export const KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const NOTIFICATION_TYPES = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  GPS_ALERT: 'gps_alert',
  MAINTENANCE: 'maintenance',
  SUPPORT: 'support',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500,
};
