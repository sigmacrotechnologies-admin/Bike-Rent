import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './utils/response.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'velocity-rent-api', timestamp: new Date().toISOString() });
});

app.use(`/api/${config.apiVersion}`, apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
