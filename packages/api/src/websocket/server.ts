import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { authenticateWsClient } from './auth.js';
import { ChannelManager } from './channels.js';
import type { WsClient, WsMessage, ServerMessage } from './types.js';

const MAX_CONNECTIONS_PER_USER = 10;
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;

export class WebSocketServer {
  private clients: Map<string, WsClient & { socket: any }> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private channelManager: ChannelManager;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.channelManager = new ChannelManager();
  }

  register(app: FastifyInstance): void {
    app.register(async (fastify) => {
      fastify.get('/v1/ws', { websocket: true }, async (socket: WebSocket, request: FastifyRequest) => {
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

        socket.on('message', (data: Buffer) => {
          this.handleMessage(wsClient, data);
        });

        socket.on('close', () => {
          this.handleDisconnect(client.id, client.userId);
        });

        socket.on('error', (error: Error) => {
          fastify.log.error({ error, clientId: client.id }, 'WebSocket error');
          this.handleDisconnect(client.id, client.userId);
        });

        socket.send(JSON.stringify({ type: 'connected', clientId: client.id }));
      });
    });

    this.startHeartbeat(app);
  }

  broadcastToChannel(channel: string, message: ServerMessage): void {
    const clientIds = this.channelManager.getClientsForChannel(channel);
    const payload = JSON.stringify(message);

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client?.socket.readyState === 1) {
        try {
          client.socket.send(payload);
        } catch (error) {
          this.handleDisconnect(clientId, client.userId);
        }
      }
    }
  }

  sendToClient(clientId: string, message: ServerMessage): void {
    const client = this.clients.get(clientId);
    if (client?.socket.readyState === 1) {
      client.socket.send(JSON.stringify(message));
    }
  }

  getChannelManager(): ChannelManager {
    return this.channelManager;
  }

  getActiveConnectionCount(): number {
    return this.clients.size;
  }

  private handleMessage(client: WsClient & { socket: any }, data: Buffer): void {
    try {
      const message: WsMessage = JSON.parse(data.toString());

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
    } catch (error) {
      client.socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  private handleSubscribe(client: WsClient & { socket: any }, message: WsMessage): void {
    const channel = message.payload?.channel as string | undefined;
    if (!channel) {
      client.socket.send(JSON.stringify({ type: 'error', message: 'Channel is required for subscribe' }));
      return;
    }

    if (this.channelManager.subscribe(client, channel)) {
      client.socket.send(JSON.stringify({ type: 'subscribed', channel }));
    } else {
      client.socket.send(JSON.stringify({ type: 'error', message: `Cannot subscribe to channel: ${channel}` }));
    }
  }

  private handleUnsubscribe(client: WsClient & { socket: any }, message: WsMessage): void {
    const channel = message.payload?.channel as string | undefined;
    if (!channel) {
      client.socket.send(JSON.stringify({ type: 'error', message: 'Channel is required for unsubscribe' }));
      return;
    }

    if (this.channelManager.unsubscribe(client, channel)) {
      client.socket.send(JSON.stringify({ type: 'unsubscribed', channel }));
    } else {
      client.socket.send(JSON.stringify({ type: 'error', message: `Not subscribed to channel: ${channel}` }));
    }
  }

  private handleDisconnect(clientId: string, userId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.channelManager.unsubscribeAll(client);

    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(clientId);
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      } else {
        this.userConnections.set(userId, userConns);
      }
    }

    this.clients.delete(clientId);
  }

  private startHeartbeat(app: FastifyInstance): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const [clientId, client] of this.clients) {
        if (now - client.lastPingAt > HEARTBEAT_TIMEOUT_MS) {
          app.log.info({ clientId }, 'WebSocket client timed out, disconnecting');
          client.socket.close(4004, 'Heartbeat timeout');
          this.handleDisconnect(clientId, client.userId);
        } else {
          try {
            client.socket.ping();
          } catch {
            this.handleDisconnect(clientId, client.userId);
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    for (const [clientId, client] of this.clients) {
      try {
        client.socket.close(1001, 'Server shutting down');
      } catch {
        // Socket already closed
      }
    }

    this.clients.clear();
    this.userConnections.clear();
  }
}
