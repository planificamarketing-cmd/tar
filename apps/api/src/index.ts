import { createApp } from './app';
import { env } from './env';
import { logger } from './lib/logger';
import { startQueue, stopQueue } from './lib/queue';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Cola de webhooks (pg-boss). Best-effort: si falla, el API sigue arriba.
startQueue().catch((err) =>
  logger.error({ err }, 'no se pudo iniciar pg-boss (webhooks deshabilitados)'),
);

// Apagado ordenado.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    void stopQueue().finally(() => server.close(() => process.exit(0)));
  });
}
