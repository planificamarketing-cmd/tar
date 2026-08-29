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
  updateUserSchema,
  updateWebhookSubscriptionSchema,
  createUserSchema,
  createScriptSchema,
  updateScriptSchema,
  createAmenitySchema,
  expandMapsSchema,
  propertyBulkSchema,
  bulkLeadsSchema,
  testWebhookSchema,
  testEventSchema,
  createSegmentSchema,
  updateSegmentSchema,
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

  // ── Usuarios (solo admin) ──
  const userSec = [{ [bearerAuth.name]: [] }];
  const userIdParam = z.object({ id: z.string().uuid() });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/users',
    tags: ['Usuarios'],
    summary: 'Listar operadores (paginado + filtros rol/activo/búsqueda)',
    security: userSec,
    request: {
      query: z.object({
        role: z.enum(['admin', 'editor']).optional(),
        active: z.enum(['true', 'false']).optional(),
        q: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
    responses: { 200: ok('{ data, meta }'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/users',
    tags: ['Usuarios'],
    summary: 'Crear operador',
    security: userSec,
    request: { body: json(createUserSchema) },
    responses: { 201: ok('Creado'), 409: ok('Correo en uso'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/{id}',
    tags: ['Usuarios'],
    summary: 'Detalle de operador',
    security: userSec,
    request: { params: userIdParam },
    responses: { 200: ok('Usuario'), 404: ok('No encontrado') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/users/{id}',
    tags: ['Usuarios'],
    summary: 'Actualizar (nombre, contraseña, rol, activo)',
    security: userSec,
    request: { params: userIdParam, body: json(updateUserSchema) },
    responses: {
      200: ok('Actualizado'),
      409: ok('Último admin / auto-bloqueo'),
      ...errResponses,
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/users/{id}',
    tags: ['Usuarios'],
    summary: 'Baja = desactivar (no hard delete); revoca sus sesiones',
    security: userSec,
    request: { params: userIdParam },
    responses: { 204: ok('Desactivado'), 409: ok('Último admin / auto-bloqueo') },
  });

  // ── Scripts de marketing (solo admin, §6.5) ──
  const scriptIdParam = z.object({ id: z.string().uuid() });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/scripts',
    tags: ['Scripts'],
    summary: 'Listar scripts (filtros opcionales placement/active)',
    security: userSec,
    request: {
      query: z.object({
        placement: z.enum(['head', 'body', 'footer']).optional(),
        active: z.enum(['true', 'false']).optional(),
      }),
    },
    responses: { 200: ok('{ data: Script[] }'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/scripts/public',
    tags: ['Scripts'],
    summary:
      'Scripts de marketing ACTIVOS agrupados por placement (head/body/footer). Público: lo consume el sitio para inyectarlos (§7.1).',
    responses: { 200: ok('{ data: { head: Script[], body: Script[], footer: Script[] } }') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/scripts',
    tags: ['Scripts'],
    summary: 'Crear script de marketing',
    security: userSec,
    request: { body: json(createScriptSchema) },
    responses: { 201: ok('Creado'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/scripts/{id}',
    tags: ['Scripts'],
    summary: 'Detalle de script',
    security: userSec,
    request: { params: scriptIdParam },
    responses: { 200: ok('Script'), 404: ok('No encontrado') },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/scripts/{id}',
    tags: ['Scripts'],
    summary: 'Actualizar (incl. activar/desactivar)',
    security: userSec,
    request: { params: scriptIdParam, body: json(updateScriptSchema) },
    responses: { 200: ok('Actualizado'), 404: ok('No encontrado'), ...errResponses },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/scripts/{id}',
    tags: ['Scripts'],
    summary: 'Eliminar script',
    security: userSec,
    request: { params: scriptIdParam },
    responses: { 204: ok('Eliminado'), 404: ok('No encontrado') },
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
    method: 'get',
    path: '/api/v1/properties/admin',
    tags: ['Propiedades'],
    summary: 'Listado del backoffice (todos los estatus, incl. borrador)',
    security: sec,
    request: {
      query: z.object({
        status: z
          .enum([
            'borrador',
            'disponible',
            'apartado',
            'rentado',
            'vendido',
            'pausado',
          ])
          .optional(),
        type: z.string().optional(),
        featured: z.enum(['normal', 'destacada', 'premium']).optional(),
        q: z.string().optional(),
        sort: z
          .enum(['recientes', 'actualizados', 'precio_asc', 'precio_desc'])
          .optional(),
        archived: z.enum(['true', 'false']).optional().openapi({
          description: "'true' → solo archivadas (soft-deleted)",
        }),
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
    responses: { 200: ok('{ data, meta }'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/admin/status-counts',
    tags: ['Propiedades'],
    summary: 'Conteo de propiedades por estatus (KPIs del dashboard)',
    security: sec,
    responses: { 200: ok('{ data: Record<status, number> }'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/admin/export.csv',
    tags: ['Propiedades'],
    summary: 'Exportar inventario a CSV (respeta filtros del listado admin)',
    security: sec,
    responses: {
      200: {
        description: 'Archivo CSV del inventario',
        content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
      },
      ...errResponses,
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/admin/type-counts',
    tags: ['Propiedades'],
    summary: 'Conteo de propiedades por tipo (mix de inventario del dashboard)',
    security: sec,
    responses: { 200: ok('{ data: Record<tipo, number> }'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/admin/{id}',
    tags: ['Propiedades'],
    summary: 'Detalle admin por id (ve borradores)',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('Propiedad'), 404: ok('No encontrada') },
  });
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
    method: 'get',
    path: '/api/v1/properties/{id}/flyer',
    tags: ['Propiedades'],
    summary: 'Flyer compartible (imagen PNG 1080×1350)',
    security: sec,
    request: { params: idParam },
    responses: {
      200: {
        description: 'Imagen PNG del flyer',
        content: { 'image/png': { schema: { type: 'string', format: 'binary' } } },
      },
      ...errResponses,
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/admin/{id}/flyer.pdf',
    tags: ['Propiedades'],
    summary: 'Folleto PDF (staff, por id; incluye borradores)',
    security: sec,
    request: {
      params: idParam,
      query: z.object({
        direccion: z
          .enum(['0', '1'])
          .optional()
          .openapi({
            description:
              'Dirección exacta en el folleto. 1 (por defecto) la incluye; 0 genera la versión para compartir con un prospecto, solo con la zona.',
            example: '0',
          }),
      }),
    },
    responses: {
      200: {
        description: 'Folleto PDF completo de la propiedad',
        content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
      },
      ...errResponses,
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/{slug}/flyer.pdf',
    tags: ['Propiedades'],
    summary: 'Folleto PDF público (por slug; solo propiedades publicadas)',
    request: {
      params: z.object({ slug: z.string().openapi({ example: 'departamento-en-polanco' }) }),
    },
    responses: {
      200: {
        description:
          'Folleto PDF de la propiedad (público). Nunca incluye la dirección exacta: solo la zona.',
        content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
      },
      404: { description: 'No encontrada o no publicada', ...json(errorRef) },
    },
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
    method: 'post',
    path: '/api/v1/properties/{id}/unpublish',
    tags: ['Propiedades'],
    summary: 'Regresar a borrador (despublicar)',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('A borrador'), 404: ok('No encontrada') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/{id}/duplicate',
    tags: ['Propiedades'],
    summary: 'Duplicar como borrador (copia datos + amenidades, sin imágenes)',
    security: sec,
    request: { params: idParam },
    responses: { 201: ok('Copia creada'), 404: ok('No encontrada') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/{id}/restore',
    tags: ['Propiedades'],
    summary: 'Restaurar una propiedad archivada',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('Restaurada'), 404: ok('No estaba archivada') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/bulk',
    tags: ['Propiedades'],
    summary: 'Acción masiva (publish/unpublish/archive/restore/status)',
    security: sec,
    request: { body: json(propertyBulkSchema) },
    responses: { 200: ok('{ data: { ok, failed[] } }'), ...errResponses },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/properties/{id}',
    tags: ['Propiedades'],
    summary: 'Archivar (soft delete, solo admin)',
    security: sec,
    request: { params: idParam },
    responses: { 204: ok('Archivada') },
  });

  // ── Amenidades ──
  registry.registerPath({
    method: 'get',
    path: '/api/v1/amenities',
    tags: ['Propiedades'],
    summary: 'Catálogo de amenidades (selector del backoffice)',
    responses: { 200: ok('{ data: Amenity[] }') },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/amenities',
    tags: ['Propiedades'],
    summary: 'Crear amenidad (admin/editor; idempotente por nombre case-insensitive)',
    security: sec,
    request: { body: json(createAmenitySchema) },
    responses: { 201: ok('{ data: Amenity }'), ...errResponses },
  });

  // ── Ubicaciones ──
  registry.registerPath({
    method: 'get',
    path: '/api/v1/locations',
    tags: ['Propiedades'],
    summary:
      'Catálogo de ubicaciones existentes (autocompletado de estado/municipio/colonia). Público: lo consume el backoffice y el buscador del sitio (§7.1).',
    responses: { 200: ok('{ data: { estado, municipio, colonia }[] }') },
  });

  // ── Geo (autocompletado desde Google Maps) ──
  registry.registerPath({
    method: 'post',
    path: '/api/v1/geo/resolve-maps',
    tags: ['Propiedades'],
    summary:
      'Resolver un enlace de Google Maps → ubicación (coords + estado/municipio/colonia/dirección/CP). Expande enlaces cortos en el servidor. Admin/editor.',
    security: sec,
    request: { body: json(expandMapsSchema) },
    responses: {
      200: ok('{ data: { lat?, lng?, estado?, municipio?, colonia?, address?, postalCode? } }'),
      422: ok('Enlace no válido / no resoluble'),
      ...errResponses,
    },
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
  // Videos (horizontal / vertical) — se guardan sin transcodificar.
  registry.registerPath({
    method: 'get',
    path: '/api/v1/properties/{id}/videos',
    tags: ['Media'],
    summary: 'Listar videos de la propiedad',
    security: sec,
    request: { params: idParam },
    responses: { 200: ok('{ data: Video[] }'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/properties/{id}/videos',
    tags: ['Media'],
    summary: 'Subir video (MP4/WebM/MOV, ≤50 MB, orientación H/V)',
    security: sec,
    request: {
      params: idParam,
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              video: z.string().openapi({ format: 'binary' }),
              orientation: z.enum(['horizontal', 'vertical']),
            }),
          },
        },
      },
    },
    responses: { 201: ok('Video creado'), ...errResponses },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/properties/{id}/videos/{videoId}',
    tags: ['Media'],
    summary: 'Eliminar video (disco + BD)',
    security: sec,
    request: {
      params: z.object({ id: z.string().uuid(), videoId: z.string().uuid() }),
    },
    responses: { 204: ok('Borrado') },
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
    path: '/api/v1/leads/export.csv',
    tags: ['Leads'],
    summary: 'Exportar prospectos a CSV (contacto, UTM, propiedad, etapa)',
    security: sec,
    request: { query: z.object({ status: z.string().optional() }) },
    responses: {
      200: {
        description: 'Archivo CSV de prospectos',
        content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
      },
      ...errResponses,
    },
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
  registry.registerPath({
    method: 'post',
    path: '/api/v1/leads/bulk',
    tags: ['Leads'],
    summary: 'Cambio de etapa masivo',
    security: sec,
    request: { body: json(bulkLeadsSchema) },
    responses: { 200: ok('{ data: { ok, failed[] } }'), ...errResponses },
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
    method: 'post',
    path: '/api/v1/webhooks/test',
    tags: ['Webhooks'],
    summary: 'Prueba ad-hoc: envía un payload de ejemplo a una URL (con firma), sin guardar',
    security: sec,
    request: { body: json(testWebhookSchema) },
    responses: { 200: ok('{ data: { ok, status, error } }'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/webhooks/test-event',
    tags: ['Webhooks'],
    summary: 'Dispara un evento de prueba a todas las suscripciones activas',
    security: sec,
    request: { body: json(testEventSchema) },
    responses: { 200: ok('{ data: { event, count, results[] } }'), ...errResponses },
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
  // ── Segmentos para Meta (solo admin: segments:manage) ──
  const segmentIdParam = z.object({ id: z.string().uuid() });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/segments',
    tags: ['Segmentos'],
    summary: 'Listar segmentos (con conteo de coincidencias)',
    security: userSec,
    responses: { 200: ok('{ data: Segment[] }'), ...errResponses },
  });
  registry.registerPath({
    method: 'post',
    path: '/api/v1/segments',
    tags: ['Segmentos'],
    summary: 'Crear segmento',
    security: userSec,
    request: { body: json(createSegmentSchema) },
    responses: { 201: ok('Creado'), ...errResponses },
  });
  registry.registerPath({
    method: 'patch',
    path: '/api/v1/segments/{id}',
    tags: ['Segmentos'],
    summary: 'Actualizar segmento',
    security: userSec,
    request: { params: segmentIdParam, body: json(updateSegmentSchema) },
    responses: { 200: ok('Actualizado'), ...errResponses },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/segments/{id}',
    tags: ['Segmentos'],
    summary: 'Eliminar segmento',
    security: userSec,
    request: { params: segmentIdParam },
    responses: { 204: ok('Eliminado'), ...errResponses },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/feeds/meta/{token}.csv',
    tags: ['Segmentos'],
    summary: 'Feed CSV de catálogo de Meta (público, por token)',
    request: { params: z.object({ token: z.string() }) },
    responses: {
      200: {
        description: 'Feed CSV',
        content: { 'text/csv': { schema: { type: 'string' } } },
      },
      404: { description: 'Token no válido o segmento inactivo' },
    },
  });

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
      { name: 'Segmentos' },
      { name: 'Sistema' },
    ],
  });
}
