import type { FastifyInstance } from 'fastify';
import { WebSocketServer } from './server.js';
export declare function getWebSocketServer(): WebSocketServer;
export declare function registerWebSocket(app: FastifyInstance): void;
