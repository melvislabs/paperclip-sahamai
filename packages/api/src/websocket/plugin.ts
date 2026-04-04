import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocketServer } from './server.js';

let wsServer: WebSocketServer | null = null;

export function getWebSocketServer(): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer();
  }
  return wsServer;
}

export function registerWebSocket(app: FastifyInstance): void {
  app.register(fastifyWebsocket);
  const server = getWebSocketServer();
  server.register(app);
}
