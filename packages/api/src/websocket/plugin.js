import fastifyWebsocket from '@fastify/websocket';
import { WebSocketServer } from './server.js';
let wsServer = null;
export function getWebSocketServer() {
    if (!wsServer) {
        wsServer = new WebSocketServer();
    }
    return wsServer;
}
export function registerWebSocket(app) {
    app.register(fastifyWebsocket);
    const server = getWebSocketServer();
    server.register(app);
}
