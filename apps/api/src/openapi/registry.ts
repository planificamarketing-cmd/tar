import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createApiKeySchema,
  createLeadSchema,
  createPropertySchema,
  createWebhookSubscriptionSchema,
  inboundWebhookSchema,
  loginSchema,
  trackEventSchema,
  updateImageSchema,
  updateLeadSchema,
  updatePropertySchema,
  updateStatusSchema,
  updateWebhookSubscriptionSchema,
} from '@tar/shared';

extendZodWithOpenApi(z);

// Documento OpenAPI 3.0 generado desde los esquemas Zod compartidos (§5.7).
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  const apiKeyAuth = registry.registerComponent('securitySchemes', 'apiKeyAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
  });

  const json = (schema: z.ZodTypeAny) => ({
    content: { 'application/json': { schema } },
  });
  const ok = (description: string) => ({ description });
  const errorRef = registry.register(
    'Error',
    z.object({
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      }),
    }),
  );
  const errResponses = {
    400: { description: 'Validación / petición inválida', ...json(errorRef) },
    401: { description: 'No autenticado', ...json(errorRef) },
  };

  // ── Auth ──
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    tags: ['Auth'],
    summary: 'Iniciar sesión (access 15m + refresh rotativo 7d)',
    request: { body: json(loginSchema) },
    responses: { 200: ok('Tokens + usuario'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    tags: ['Auth'],
    summary: 'Rotar el refresh y emitir un nuevo access',
    responses: { 200: ok('Nuevos tokens'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    tags: ['Auth'],
    summary: 'Revocar el refresh token',
    responses: { 204: ok('Sesión cerrada') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    tags: ['Auth'],
    summary: 'Usuario autenticado',
    security: [{ [bearerAuth.name]: [] }],
    responses: { 200: ok('Usuario'), ...errResponses },
  });

  // ── Propiedades (público) ──
  const propertyQuery = z.object({
    operation: z.enum(['venta', 'renta']).optional(),
    type: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    parking: z.number().optional(),
    minArea: z.number().optional(),
    maxArea: z.number().optional(),
    amenities: z.string().optional().openapi({ description: 'IDs separados por coma' }),
    colonia: z.string().optional(),
    q: z.string().optional().openapi({ description: 'Búsqueda full-text' }),
    sort: z
      .enum(['relevancia', 'precio_asc', 'precio_desc', 'recientes'])
      .optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties',
    tags: ['Propiedades'],
    summary: 'Listado público con filtros, orden y paginación',
    request: { query: propertyQuery },
    responses: { 200: ok('{ data, meta }') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/map',
    tags: ['Propiedades'],
    summary: 'Puntos para el mapa por bbox (ST_Within)',
    request: {
      query: z.object({
        bbox: z.string().optional().openapi({
          description: 'minLng,minLat,maxLng,maxLat',
          example: '-99.30,19.30,-99.10,19.50',
        }),
        operation: z.enum(['venta', 'renta']).optional(),
      }),
    },
    responses: { 200: ok('{ data: MapPoint[] }') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/{slug}',
    tags: ['Propiedades'],
    summary: 'Detalle público (imágenes + amenidades)',
    request: { params: z.object({ slug: z.string() }) },
    responses: { 200: ok('Propiedad'), 404: ok('No encontrada') },
  });

  // ── Propiedades (admin/editor) ──
  const sec = [{ [bearerAuth.name]: [] }];
  const idParam = z.object({ id: z.string().uuid() });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties',
    tags: ['Propiedades'],
    summary: 'Crear borrador',
    security: sec,
    request: { body: json(createPropertySchema) },
    responses: { 201: ok('Creada'), ...errResponses },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/properties/{id}',
    tags: ['Propiedades'],
    summary: 'Actualizar',
    security: sec,
    request: { params: idParam, body: json(updatePropertySchema) },
    responses: { 200: ok('Actualizada'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/{id}/publish',
    tags: ['Propiedades'],
    summary: 'Publicar (valida geo, slug inmutable, property.published)',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('Publicada'), 422: ok('Falta geo o precio') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/properties/{id}/status',
    tags: ['Propiedades'],
    summary: 'Cambiar estatus comercial (property.status_changed)',
    security: sec,
    request: { params: idParam, body: json(updateStatusSchema) },
    responses: { 200: ok('OK'), ...errResponses },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/properties/{id}',
    tags: ['Propiedades'],
    summary: 'Soft delete (solo admin)',
    security: sec,
    request: { params: idParam },
    responses: { 204: ok('Borrada') },
  });

  // ── Media ──
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/{id}/images',
    tags: ['Media'],
    summary: 'Subir imágenes (sharp → WebP + thumb)',
    security: sec,
    request: {
      params: idParam,
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              images: z.array(z.string().openapi({ format: 'binary' })),
            }),
          },
        },
      },
    },
    responses: { 201: ok('Imágenes creadas'), ...errResponses },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/properties/{id}/images/{imgId}',
    tags: ['Media'],
    summary: 'Reordenar / portada / alt',
    security: sec,
    request: {
      params: z.object({ id: z.string().uuid(), imgId: z.string().uuid() }),
      body: json(updateImageSchema),
    },
    responses: { 200: ok('OK') },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/properties/{id}/images/{imgId}',
    tags: ['Media'],
    summary: 'Eliminar imagen (disco + BD)',
    security: sec,
    request: {
      params: z.object({ id: z.string().uuid(), imgId: z.string().uuid() }),
    },
    responses: { 204: ok('Borrada') },
  });

  // ── Leads ──
  registry.registerPath({
    method: 'post',
    path: '/api/v1/leads',
    tags: ['Leads'],
    summary: 'Captación pública (honeypot + consentimiento LFPDPPP)',
    request: { body: json(createLeadSchema) },
    responses: { 201: ok('Lead creado'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/events/track',
    tags: ['Leads'],
    summary: 'Registrar vista de propiedad (analítica)',
    request: { body: json(trackEventSchema) },
    responses: { 204: ok('Registrado') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/leads',
    tags: ['Leads'],
    summary: 'Listado admin',
    security: sec,
    request: {
      query: z.object({
        status: z.string().optional(),
        propertyId: z.string().uuid().optional(),
        assignedTo: z.string().uuid().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
    responses: { 200: ok('{ data, meta }') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/leads/{id}',
    tags: ['Leads'],
    summary: 'Detalle + bitácora',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('Lead + events') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/leads/{id}',
    tags: ['Leads'],
    summary: 'Cambiar status/asignación (lead.status_changed)',
    security: sec,
    request: { params: idParam, body: json(updateLeadSchema) },
    responses: { 200: ok('OK') },
  });

  // ── Webhooks ──
  registry.registerPath({
    method: 'get',
    path: '/api/v1/webhooks/subscriptions',
    tags: ['Webhooks'],
    summary: 'Listar suscripciones salientes',
    security: sec,
    responses: { 200: ok('{ data }') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/webhooks/subscriptions',
    tags: ['Webhooks'],
    summary: 'Crear suscripción',
    security: sec,
    request: { body: json(createWebhookSubscriptionSchema) },
    responses: { 201: ok('Creada') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/webhooks/subscriptions/{id}',
    tags: ['Webhooks'],
    summary: 'Editar suscripción',
    security: sec,
    request: { params: idParam, body: json(updateWebhookSubscriptionSchema) },
    responses: { 200: ok('OK') },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/webhooks/subscriptions/{id}',
    tags: ['Webhooks'],
    summary: 'Eliminar suscripción',
    security: sec,
    request: { params: idParam },
    responses: { 204: ok('Borrada') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/webhooks/deliveries',
    tags: ['Webhooks'],
    summary: 'Bitácora de entregas',
    security: sec,
    responses: { 200: ok('{ data }') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/webhooks/deliveries/{id}/retry',
    tags: ['Webhooks'],
    summary: 'Reintentar entrega',
    security: sec,
    request: { params: idParam },
    responses: { 202: ok('Reencolada') },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/webhooks/api-keys',
    tags: ['Webhooks'],
    summary: 'Listar llaves de API entrantes',
    security: sec,
    responses: { 200: ok('{ data }') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/webhooks/api-keys',
    tags: ['Webhooks'],
    summary: 'Crear llave (la llave en claro solo se muestra aquí)',
    security: sec,
    request: { body: json(createApiKeySchema) },
    responses: { 201: ok('{ data: { key } }') },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/webhooks/api-keys/{id}',
    tags: ['Webhooks'],
    summary: 'Revocar llave',
    security: sec,
    request: { params: idParam },
    responses: { 204: ok('Revocada') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/webhooks/inbound',
    tags: ['Webhooks'],
    summary: 'Webhook entrante (X-API-Key + scopes)',
    security: [{ [apiKeyAuth.name]: [] }],
    request: { body: json(inboundWebhookSchema) },
    responses: { 200: ok('Aplicado'), 403: ok('Scope insuficiente') },
  });

  // ── Salud ──
  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['Sistema'],
    summary: 'Healthcheck (BD/PostGIS)',
    responses: { 200: ok('{ status, db, postgis }') },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'TAR Internacional — API',
      version: '1.0.0',
      description:
        'API REST del portal inmobiliario TAR Internacional. Generada desde los esquemas Zod compartidos.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
    tags: [
      { name: 'Auth' },
      { name: 'Propiedades' },
      { name: 'Media' },
      { name: 'Leads' },
      { name: 'Webhooks' },
      { name: 'Sistema' },
    ],
  });
}
