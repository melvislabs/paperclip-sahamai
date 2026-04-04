import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { SignalStore } from '@sahamai/shared';
import { verifyAccessToken } from '../auth/utils.js';
import type { UserRole } from '../auth/types.js';

type WsMessage =
  | { type: 'subscribe'; symbols?: string[]; channel?: string }
  | { type: 'unsubscribe'; symbols?: string[]; channel?: string }
  | { type: 'ping' }
  | { type: 'signal'; symbol: string; action: string; confidence: number; generatedAt: string }
  | { type: 'price'; symbol: string; price: number; change: number; changePercent: number; volume: number }
  | { type: 'alert'; data: { id: string; symbol: string; condition: string; threshold: number; currentPrice: number; triggeredAt: string } }
  | { type: 'analysis'; data: { symbol: string; recommendation: string; confidence: number; summary: string; timestamp: string } }
  | { type: 'portfolio'; data: { portfolioId: string; totalValue: number; cashBalance: number; change24h: number; timestamp: string } }
  | { type: 'pong' }
  | { type: 'error'; message: string }
  | { type: 'connected'; clientId: string }
  | { type: 'subscribed'; channel: string }
  | { type: 'unsubscribed'; channel: string };

interface WsClient {
  conn: WebSocket;
  symbols: Set<string>;
  channels: Set<string>;
  userId: string;
  email: string;
  role: UserRole;
  alive: boolean;
}

const heartbeatInterval = 30_000;
const MAX_CONNECTIONS_PER_USER = 10;

export function registerWebSocketRoutes(app: FastifyInstance, store: SignalStore, nowProvider: () => number = () => Date.now()) {
  const clients = new Map<string, WsClient>();
  const userConnections = new Map<string, Set<string>>();
  let clientIdCounter = 0;

  app.get('/v1/ws', { websocket: true }, (socket: WebSocket, request: FastifyRequest) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.send(JSON.stringify({ type: 'error', message: 'Authentication token required. Connect with ?token=<jwt>' }));
      socket.close(4001, 'Missing token');
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
      socket.close(4002, 'Invalid token');
      return;
    }

    const userConns = userConnections.get(payload.userId) ?? new Set();
    if (userConns.size >= MAX_CONNECTIONS_PER_USER) {
      socket.send(JSON.stringify({ type: 'error', message: 'Maximum connections reached' }));
      socket.close(4003, 'Max connections');
      return;
    }

    const clientId = `ws-${++clientIdCounter}`;
    const client: WsClient = {
      conn: socket,
      symbols: new Set(),
      channels: new Set(),
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      alive: true,
    };
    clients.set(clientId, client);
    userConns.add(clientId);
    userConnections.set(payload.userId, userConns);

    socket.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        handleMessage(clientId, client, msg);
      } catch {
        sendToClient(client, { type: 'error', message: 'Invalid JSON message' });
      }
    });

    socket.on('close', () => {
      handleDisconnect(clientId, payload.userId);
    });

    socket.on('error', (error: Error) => {
      app.log.error({ error, clientId }, 'WebSocket error');
      handleDisconnect(clientId, payload.userId);
    });

    socket.on('pong', () => {
      client.alive = true;
    });

    sendToClient(client, {
      type: 'connected',
      clientId,
    });
  });

  function handleMessage(clientId: string, client: WsClient, msg: WsMessage) {
    switch (msg.type) {
      case 'subscribe':
        handleSubscribe(clientId, client, msg);
        break;
      case 'unsubscribe':
        handleUnsubscribe(clientId, client, msg);
        break;
      case 'ping':
        sendToClient(client, { type: 'pong' });
        break;
      default:
        sendToClient(client, { type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  }

  function handleSubscribe(clientId: string, client: WsClient, msg: WsMessage & { type: 'subscribe' }) {
    if (msg.symbols) {
      for (const sym of msg.symbols) {
        client.symbols.add(sym.toUpperCase());
        const channel = `price:${sym.toUpperCase()}`;
        client.channels.add(channel);
        sendToClient(client, { type: 'subscribed', channel });
      }
    }

    if (msg.channel) {
      if (isValidChannel(client, msg.channel)) {
        client.channels.add(msg.channel);
        sendToClient(client, { type: 'subscribed', channel: msg.channel });
      } else {
        sendToClient(client, { type: 'error', message: `Cannot subscribe to channel: ${msg.channel}` });
      }
    }
  }

  function handleUnsubscribe(clientId: string, client: WsClient, msg: WsMessage & { type: 'unsubscribe' }) {
    if (msg.symbols) {
      for (const sym of msg.symbols) {
        client.symbols.delete(sym.toUpperCase());
        const channel = `price:${sym.toUpperCase()}`;
        client.channels.delete(channel);
        sendToClient(client, { type: 'unsubscribed', channel });
      }
    }

    if (msg.channel) {
      if (client.channels.has(msg.channel)) {
        client.channels.delete(msg.channel);
        sendToClient(client, { type: 'unsubscribed', channel: msg.channel });
      } else {
        sendToClient(client, { type: 'error', message: `Not subscribed to channel: ${msg.channel}` });
      }
    }
  }

  function isValidChannel(client: WsClient, channel: string): boolean {
    const parts = channel.split(':');
    if (parts.length < 2) return false;

    const [type, ...rest] = parts;
    const target = rest.join(':');

    switch (type) {
      case 'price':
      case 'analysis':
        return target.length > 0 && target.length <= 10;
      case 'alert':
        return target === client.userId;
      case 'portfolio':
        return true;
      default:
        return false;
    }
  }

  function handleDisconnect(clientId: string, userId: string) {
    clients.delete(clientId);

    const userConns = userConnections.get(userId);
    if (userConns) {
      userConns.delete(clientId);
      if (userConns.size === 0) {
        userConnections.delete(userId);
      }
    }
  }

  function sendToClient(client: WsClient, message: WsMessage) {
    if (client.conn.readyState === 1) {
      client.conn.send(JSON.stringify(message));
    }
  }

  function broadcastToChannel(channel: string, message: WsMessage) {
    for (const [, client] of clients) {
      if (client.channels.has(channel) || (channel.startsWith('price:') && client.symbols.has(channel.split(':')[1]))) {
        sendToClient(client, message);
      }
    }
  }

  app.addHook('onClose', async () => {
    for (const [, client] of clients) {
      client.conn.close();
    }
    clients.clear();
    userConnections.clear();
  });

  const heartbeat = setInterval(() => {
    for (const [id, client] of clients) {
      if (!client.alive) {
        client.conn.close();
        clients.delete(id);
        continue;
      }
      client.alive = false;
      client.conn.ping();
    }
  }, heartbeatInterval);

  app.addHook('onClose', async () => {
    clearInterval(heartbeat);
  });

  return {
    broadcastSignal(symbol: string, signal: { action: string; confidence: number; generatedAt: string }) {
      broadcastToChannel(`price:${symbol}`, {
        type: 'signal',
        symbol,
        action: signal.action,
        confidence: signal.confidence,
        generatedAt: signal.generatedAt,
      });
    },
    broadcastPrice(symbol: string, price: { price: number; change: number; changePercent: number; volume: number }) {
      broadcastToChannel(`price:${symbol}`, {
        type: 'price',
        symbol,
        ...price,
      });
    },
    broadcastAlert(userId: string, alert: { id: string; symbol: string; condition: string; threshold: number; currentPrice: number }) {
      broadcastToChannel(`alert:${userId}`, {
        type: 'alert',
        data: {
          ...alert,
          triggeredAt: new Date(nowProvider()).toISOString(),
        },
      });
    },
    broadcastAnalysis(symbol: string, analysis: { recommendation: string; confidence: number; summary: string }) {
      broadcastToChannel(`analysis:${symbol}`, {
        type: 'analysis',
        data: {
          symbol,
          ...analysis,
          timestamp: new Date(nowProvider()).toISOString(),
        },
      });
    },
    broadcastPortfolio(portfolioId: string, data: { totalValue: number; cashBalance: number; change24h: number }) {
      broadcastToChannel(`portfolio:${portfolioId}`, {
        type: 'portfolio',
        data: {
          portfolioId,
          ...data,
          timestamp: new Date(nowProvider()).toISOString(),
        },
      });
    },
    getClientCount() {
      return clients.size;
    },
  };
}
