import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { config } from './config/index.js';
import connectDB from './config/database.js';
import './models/index.js';
import logger from './utils/logger.js';
import gpsService from './modules/gps/gps.service.js';
import analyticsService from './modules/analytics/analytics.service.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin, credentials: true },
  pingTimeout: 60000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
    if (['super_admin', 'admin', 'staff'].includes(socket.userRole)) {
      socket.join('admin');
    }
  }

  socket.on('join:vehicle', (vehicleId) => {
    socket.join(`vehicle:${vehicleId}`);
  });

  socket.on('leave:vehicle', (vehicleId) => {
    socket.leave(`vehicle:${vehicleId}`);
  });

  socket.on('gps:update', async (data) => {
    try {
      const log = await gpsService.recordLocation(data);
      io.to(`vehicle:${data.vehicleId}`).emit('gps:location', log);
      io.to('admin').emit('gps:fleet-update', { vehicleId: data.vehicleId, location: log });

      if (log.speed > 120) {
        io.to('admin').emit('gps:alert', { type: 'overspeed', vehicleId: data.vehicleId, speed: log.speed });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('booking:subscribe', (bookingId) => {
    socket.join(`booking:${bookingId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

setInterval(async () => {
  try {
    const stats = await analyticsService.getDashboardStats();
    io.to('admin').emit('dashboard:stats', stats.kpis);
  } catch {
    // silent fail for background stats
  }
}, 30000);

export const emitNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

export const emitBookingUpdate = (bookingId, data) => {
  io.to(`booking:${bookingId}`).emit('booking:update', data);
  io.to('admin').emit('booking:update', data);
};

export const emitVehicleAvailability = (data) => {
  io.emit('vehicle:availability', data);
};

const start = async () => {
  await connectDB();

  httpServer.listen(config.port, () => {
    logger.info(`${config.appName} API running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`API Version: /api/${config.apiVersion}`);
  });
};

start();

export { io };
