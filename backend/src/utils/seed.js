import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import connectDB from '../config/database.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import GPSLog from '../models/GPSLog.js';
import Maintenance from '../models/Maintenance.js';
import Coupon from '../models/Coupon.js';
import ServiceArea from '../models/ServiceArea.js';
import Wallet from '../models/Wallet.js';
import { ROLES, VEHICLE_TYPES } from './constants.js';
import logger from './logger.js';
import {
  sampleVehicles,
  sampleReviews,
  buildSampleBookings,
  buildGPSLogs,
} from './seed.data.js';
import { getThumbnail } from './vehicleImages.js';

const toSlug = (name, suffix = '') =>
  `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}${suffix ? `-${suffix}` : ''}`;

const seedRoles = async () => {
  const roles = [
    { name: ROLES.SUPER_ADMIN, description: 'Full system access', isSystem: true, permissions: [{ resource: '*', actions: ['manage'] }] },
    { name: ROLES.ADMIN, description: 'Administrative access', isSystem: true, permissions: [{ resource: 'fleet', actions: ['manage'] }, { resource: 'bookings', actions: ['manage'] }] },
    { name: ROLES.STAFF, description: 'Staff operations', isSystem: true, permissions: [{ resource: 'bookings', actions: ['read', 'update'] }] },
    { name: ROLES.CUSTOMER, description: 'Customer access', isSystem: true, permissions: [{ resource: 'bookings', actions: ['create', 'read'] }] },
  ];

  for (const role of roles) {
    await Role.findOneAndUpdate({ name: role.name }, role, { upsert: true });
  }
};

const seedUsers = async () => {
  let admin = await User.findOne({ email: 'admin@velocityrent.com' }).select('+password');
  if (!admin) {
    admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@velocityrent.com',
      phone: '9876543210',
      password: 'Admin@123456',
      role: ROLES.SUPER_ADMIN,
      isEmailVerified: true,
      kyc: { status: 'verified' },
    });
    logger.info('Super Admin created: admin@velocityrent.com / Admin@123456');
  } else {
    admin.password = 'Admin@123456';
    admin.isActive = true;
    await admin.save();
    logger.info('Super Admin password reset: admin@velocityrent.com / Admin@123456');
  }

  let customer = await User.findOne({ email: 'customer@velocityrent.com' }).select('+password');
  if (!customer) {
    customer = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@velocityrent.com',
      phone: '9876543211',
      password: 'Customer@123',
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
      kyc: { status: 'verified', documentType: 'driving_license' },
    });
    logger.info('Demo Customer created: customer@velocityrent.com / Customer@123');
  } else {
    customer.password = 'Customer@123';
    customer.isActive = true;
    await customer.save();
    logger.info('Demo Customer password reset: customer@velocityrent.com / Customer@123');
  }

  return { admin, customer };
};

const seedWallets = async (customer) => {
  await Wallet.findOneAndUpdate(
    { user: customer._id },
    { user: customer._id, balance: 25000 },
    { upsert: true }
  );
  logger.info('Demo customer wallet seeded with ₹25,000');
};

const seedVehicles = async () => {
  let created = 0;
  let updated = 0;

  for (let i = 0; i < sampleVehicles.length; i++) {
    const data = sampleVehicles[i];
    const slug = toSlug(data.name, String(i + 1));
    const thumbnail = getThumbnail(data.registrationNumber, data.type);

    const existing = await Vehicle.findOne({ registrationNumber: data.registrationNumber });
    if (existing) {
      await Vehicle.findByIdAndUpdate(existing._id, { ...data, slug: existing.slug || slug, thumbnail }, { runValidators: true });
      updated++;
    } else {
      await Vehicle.create({ ...data, slug, thumbnail });
      created++;
    }
  }

  const bikes = sampleVehicles.filter((v) => v.type === VEHICLE_TYPES.BIKE).length;
  const cars = sampleVehicles.filter((v) => v.type === VEHICLE_TYPES.CAR).length;
  logger.info(`Vehicles seeded: ${created} created, ${updated} updated (${bikes} bikes, ${cars} cars)`);

  return Vehicle.find({ isActive: true });
};

const seedBookings = async (customer, vehicles) => {
  const bookings = buildSampleBookings(customer._id, vehicles);
  let count = 0;

  for (const data of bookings) {
    const exists = await Booking.findOne({ bookingNumber: data.bookingNumber });
    if (!exists) {
      await Booking.create(data);
      count++;
    }
  }

  logger.info(`Bookings seeded: ${count} sample bookings (bikes & cars)`);
  return Booking.find({ user: customer._id });
};

const seedReviews = async (customer, bookings) => {
  let count = 0;

  for (const reviewData of sampleReviews) {
    const vehicle = await Vehicle.findOne({ registrationNumber: reviewData.vehicleReg });
    if (!vehicle) continue;

    const booking = bookings.find((b) => b.vehicle.toString() === vehicle._id.toString());
    if (!booking) continue;

    const exists = await Review.findOne({ user: customer._id, booking: booking._id });
    if (!exists) {
      await Review.create({
        user: customer._id,
        vehicle: vehicle._id,
        booking: booking._id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
      });
      count++;
    }
  }

  logger.info(`Reviews seeded: ${count} sample reviews`);
};

const seedGPSLogs = async (vehicles) => {
  const existingCount = await GPSLog.countDocuments();
  if (existingCount >= 10) {
    logger.info('GPS logs already seeded, skipping');
    return;
  }

  const logs = buildGPSLogs(vehicles);
  if (logs.length) {
    await GPSLog.insertMany(logs);
    logger.info(`GPS logs seeded: ${logs.length} live locations for bikes & cars`);
  }
};

const seedMaintenance = async (vehicles, admin) => {
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance');
  let count = 0;

  for (const vehicle of maintenanceVehicles) {
    const exists = await Maintenance.findOne({ vehicle: vehicle._id, status: { $ne: 'completed' } });
    if (!exists) {
      await Maintenance.create({
        vehicle: vehicle._id,
        type: 'scheduled',
        title: `${vehicle.name} — Scheduled Service`,
        description: 'Regular service including oil change, brake check, and tire inspection.',
        status: 'in_progress',
        scheduledDate: new Date(),
        cost: vehicle.type === VEHICLE_TYPES.BIKE ? 1500 : 4500,
        assignedTo: admin._id,
        createdBy: admin._id,
      });
      count++;
    }
  }

  logger.info(`Maintenance seeded: ${count} active service records`);
};

const seedCoupons = async () => {
  const coupons = [
    {
      code: 'WELCOME20',
      description: '20% off on first booking',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 500,
      minOrderAmount: 500,
      usageLimit: 1000,
    },
    {
      code: 'BIKE15',
      description: '15% off on all bike rentals',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: 300,
      minOrderAmount: 400,
      vehicleTypes: ['bike'],
      usageLimit: 500,
    },
    {
      code: 'CAR500',
      description: 'Flat ₹500 off on car rentals',
      discountType: 'fixed',
      discountValue: 500,
      minOrderAmount: 2000,
      vehicleTypes: ['car'],
      usageLimit: 300,
    },
  ];

  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      {
        ...coupon,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      { upsert: true }
    );
  }

  logger.info(`Coupons seeded: ${coupons.length} (WELCOME20, BIKE15, CAR500)`);
};

const seedLocations = async () => {
  const areas = [
    {
      name: 'Pune',
      state: 'Maharashtra',
      hubs: [
        { name: 'Pune Central', address: 'FC Road, Shivajinagar' },
        { name: 'Kothrud', address: 'Karve Road, Kothrud' },
        { name: 'Hinjewadi', address: 'Phase 1, Hinjewadi IT Park' },
        { name: 'Koregaon Park', address: 'North Main Road' },
        { name: 'Kharadi', address: 'EON IT Park, Kharadi' },
      ],
    },
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      hubs: [
        { name: 'Andheri', address: 'Veera Desai Road' },
        { name: 'Bandra', address: 'Linking Road' },
      ],
    },
    {
      name: 'Baramati',
      state: 'Maharashtra',
      hubs: [
        { name: 'Baramati Station Road', address: 'Station Road, Baramati' },
        { name: 'MIDC Baramati', address: 'MIDC Industrial Area' },
        { name: 'Nira Road', address: 'Nira Road Hub' },
        { name: 'Bhigwan Road', address: 'Bhigwan Road Pickup Point' },
        { name: 'Market Yard', address: 'Baramati Market Yard' },
      ],
    },
  ];

  for (const area of areas) {
    const slug = area.name.toLowerCase().replace(/\s+/g, '-');
    await ServiceArea.findOneAndUpdate(
      { slug },
      {
        name: area.name,
        slug,
        state: area.state,
        isActive: true,
        hubs: area.hubs.map((h) => ({ ...h, isActive: true })),
      },
      { upsert: true, new: true }
    );
  }

  logger.info(`Service areas seeded: ${areas.length} cities (Pune, Mumbai, Baramati)`);
};

const seed = async () => {
  await connectDB();
  await seedRoles();
  await seedLocations();
  const { admin, customer } = await seedUsers();
  await seedWallets(customer);
  const vehicles = await seedVehicles();
  const bookings = await seedBookings(customer, vehicles);
  await seedReviews(customer, bookings);
  await seedGPSLogs(vehicles);
  await seedMaintenance(vehicles, admin);
  await seedCoupons();
  logger.info('✅ Full sample data seeding completed');
  process.exit(0);
};

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
