import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { corsOrigin, env } from './env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { scriptsRouter } from './modules/scripts/scripts.routes';
import { propertiesRouter } from './modules/properties/properties.routes';
import { mediaRouter } from './modules/media/media.routes';
import { amenitiesRouter } from './modules/amenities/amenities.routes';
import { leadsRouter } from './modules/leads/leads.routes';
import { trackingRouter } from './modules/tracking/tracking.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';
import { docsRouter } from './openapi/openapi.routes';

// Construye la app Express sin ponerla a escuchar (testeable con supertest).
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(hpp());

  // Rate-limit global (los límites estrictos por ruta —p.ej. /auth/login— viven
  // en cada router).
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  // Media servida en dev por el API; en prod la sirve Caddy desde MEDIA_DIR.
  app.use('/media', express.static(env.MEDIA_DIR));

  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/scripts', scriptsRouter);
  app.use('/api/v1/properties', propertiesRouter);
  app.use('/api/v1/properties', mediaRouter);
  app.use('/api/v1/amenities', amenitiesRouter);
  app.use('/api/v1/leads', leadsRouter);
  app.use('/api/v1/events', trackingRouter);
  app.use('/api/v1/webhooks', webhooksRouter);
  app.use('/docs', docsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
