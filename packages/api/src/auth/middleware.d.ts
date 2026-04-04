import type { FastifyRequest, FastifyReply, FastifyInstance, FastifySchema } from 'fastify';
import type { TokenPayload, UserRole } from './types.js';
declare module 'fastify' {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}
export declare function authMiddleware(request: FastifyRequest, reply: FastifyReply): void;
export declare function requireRole(requiredRole: UserRole): (request: FastifyRequest, reply: FastifyReply) => FastifyReply<import("fastify").RouteGenericInterface, import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, unknown, FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown> | undefined;
export declare function apiKeyMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function registerAuthRoutes(app: FastifyInstance): void;
export declare function protectRoutes(app: FastifyInstance, routes: string[], options?: {
    skipAuth?: string[];
}): void;
