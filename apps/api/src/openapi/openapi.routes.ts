import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './registry';

// Documentación interactiva (§5.7): Swagger UI en /docs + spec en /docs/openapi.json.
export const docsRouter: Router = Router();

const document = buildOpenApiDocument();

// CSP relajada solo aquí para que Swagger UI cargue sus scripts/estilos inline.
docsRouter.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
  );
  next();
});

docsRouter.get('/openapi.json', (_req, res) => {
  res.json(document);
});

docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(document, { customSiteTitle: 'TAR Internacional — API' }),
);
