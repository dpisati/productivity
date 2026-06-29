import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { AppError } from '../lib/errors.js';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/** Global error handler mapping validation, app, and unexpected errors to a
 * consistent `{ error: { code, message, details? } }` envelope. */
export const errorHandlerPlugin = fp(
  async (app) => {
    app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
      } satisfies ErrorBody);
    });

    app.setErrorHandler((error, request, reply) => {
      // Request body/params/query failed Zod validation.
      if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.validation,
          },
        } satisfies ErrorBody);
      }

      // Response failed to serialize against its declared schema (our bug).
      if (isResponseSerializationError(error)) {
        request.log.error(error, 'response serialization error');
        return reply.status(500).send({
          error: { code: 'INTERNAL_ERROR', message: 'Response serialization failed' },
        } satisfies ErrorBody);
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          error: { code: error.code, message: error.message, details: error.details },
        } satisfies ErrorBody);
      }

      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.issues },
        } satisfies ErrorBody);
      }

      // Fastify's own thrown HTTP errors (e.g. from @fastify/sensible).
      const httpError = error as { statusCode?: number; code?: string; message?: string };
      if (typeof httpError.statusCode === 'number' && httpError.statusCode < 500) {
        return reply.status(httpError.statusCode).send({
          error: { code: httpError.code ?? 'ERROR', message: httpError.message ?? 'Error' },
        } satisfies ErrorBody);
      }

      request.log.error(error);
      return reply.status(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      } satisfies ErrorBody);
    });
  },
  { name: 'error-handler' },
);
