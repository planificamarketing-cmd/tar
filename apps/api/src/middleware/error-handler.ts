import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

// Forma de error de la API (la guía del proyecto → Convenciones): { error: { code, message, details? } }
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: 'Recurso no encontrado.' },
  });
};

// errorHandler central. La firma de 4 argumentos es obligatoria para que Express
// lo trate como manejador de errores.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Datos de entrada inválidos.',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Errores de subida (multer): p.ej. archivo demasiado grande.
  if (
    err instanceof Error &&
    err.name === 'MulterError'
  ) {
    res.status(400).json({
      error: {
        code: 'upload_error',
        message: 'Error al subir el archivo (tamaño o cantidad excedidos).',
        details: (err as { code?: string }).code,
      },
    });
    return;
  }

  logger.error({ err }, 'Error no controlado');
  res.status(500).json({
    error: { code: 'internal_error', message: 'Error interno del servidor.' },
  });
};
