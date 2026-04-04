import { authenticateWsClient } from './auth.js';
import { ChannelManager } from './channels.js';
const MAX_CONNECTIONS_PER_USER = 10;
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;
export class WebSocketServer {
    clients = new Map();
    userConnections = new Map();
    channelManager;
    heartbeatTimer = null;
    constructor() {
        this.channelManager = new ChannelManager();
    }
    register(app) {
        app.register(async (fastify) => {
            fastify.get('/v1/ws', { websocket: true }, async (socket, request) => {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const token = url.searchParams.get('token');
                if (!token) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Authentication token required' }));
                    socket.close(4001, 'Missing token');
                    return;
                }
                const client = authenticateWsClient(token);
                if (!client) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
                    socket.close(4002, 'Invalid token');
                    return;
                }
                const userConns = this.userConnections.get(client.userId) ?? new Set();
                if (userConns.size >= MAX_CONNECTIONS_PER_USER) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Maximum connections reached' }));
                    socket.close(4003, 'Max connections');
                    return;
                }
                const wsClient = { ...client, socket: socket };
                this.clients.set(client.id, wsClient);
                userConns.add(client.id);
                this.userConnections.set(client.userId, userConns);
                socket.on('message', (data) => {
                    this.handleMessage(wsClient, data);
                });
                socket.on('close', () => {
                    this.handleDisconnect(client.id, client.userId);
                });
                socket.on('error', (error) => {
                    fastify.log.error({ error, clientId: client.id }, 'WebSocket error');
                    this.handleDisconnect(client.id, client.userId);
                });
                socket.send(JSON.stringify({ type: 'connected', clientId: client.id }));
            });
        });
        this.startHeartbeat(app);
    }
    broadcastToChannel(channel, message) {
        const clientIds = this.channelManager.getClientsForChannel(channel);
        const payload = JSON.stringify(message);
        for (const clientId of clientIds) {
            const client = this.clients.get(clientId);
            if (client?.socket.readyState === 1) {
                try {
                    client.socket.send(payload);
                }
                catch (error) {
                    this.handleDisconnect(clientId, client.userId);
                }
            }
        }
    }
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client?.socket.readyState === 1) {
            client.socket.send(JSON.stringify(message));
        }
    }
    getChannelManager() {
        return this.channelManager;
    }
    getActiveConnectionCount() {
        return this.clients.size;
    }
    handleMessage(client, data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'subscribe':
                    this.handleSubscribe(client, message);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(client, message);
                    break;
                case 'ping':
                    client.lastPingAt = Date.now();
                    client.socket.send(JSON.stringify({ type: 'pong' }));
                    break;
                default:
                    client.socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
            }
        }
        catch (error) {
            client.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
    }
    handleSubscribe(client, message) {
        const channel = message.payload?.channel;
        if (!channel) {
            client.socket.send(JSON.stringify({ type: 'error', message: 'Channel is required for subscribe' }));
            return;
        }
        if (this.channelManager.subscribe(client, channel)) {
            client.socket.send(JSON.stringify({ type: 'subscribed', channel }));
        }
        else {
            client.socket.send(JSON.stringify({ type: 'error', message: `Cannot subscribe to channel: ${channel}` }));
        }
    }
    handleUnsubscribe(client, message) {
        const channel = message.payload?.channel;
        if (!channel) {
            client.socket.send(JSON.stringify({ type: 'error', message: 'Channel is required for unsubscribe' }));
            return;
        }
        if (this.channelManager.unsubscribe(client, channel)) {
            client.socket.send(JSON.stringify({ type: 'unsubscribed', channel }));
        }
        else {
            client.socket.send(JSON.stringify({ type: 'error', message: `Not subscribed to channel: ${channel}` }));
        }
    }
    handleDisconnect(clientId, userId) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        this.channelManager.unsubscribeAll(client);
        const userConns = this.userConnections.get(userId);
        if (userConns) {
            userConns.delete(clientId);
            if (userConns.size === 0) {
                this.userConnections.delete(userId);
            }
            else {
                this.userConnections.set(userId, userConns);
            }
        }
        this.clients.delete(clientId);
    }
    startHeartbeat(app) {
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            for (const [clientId, client] of this.clients) {
                if (now - client.lastPingAt > HEARTBEAT_TIMEOUT_MS) {
                    app.log.info({ clientId }, 'WebSocket client timed out, disconnecting');
                    client.socket.close(4004, 'Heartbeat timeout');
                    this.handleDisconnect(clientId, client.userId);
                }
                else {
                    try {
                        client.socket.ping();
                    }
                    catch {
                        this.handleDisconnect(clientId, client.userId);
                    }
                }
            }
        }, HEARTBEAT_INTERVAL_MS);
    }
    shutdown() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        for (const [clientId, client] of this.clients) {
            try {
                client.socket.close(1001, 'Server shutting down');
            }
            catch {
                // Socket already closed
            }
        }
        this.clients.clear();
        this.userConnections.clear();
    }
}
