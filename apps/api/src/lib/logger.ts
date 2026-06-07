import { pino } from 'pino';
import { env } from '../env';

// Logger central (pino). En dev usa nivel debug; en prod, info. Formato JSON
// estructurado (sin pino-pretty para no añadir deps; se puede pipe-ar a `pino-pretty`).
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});
