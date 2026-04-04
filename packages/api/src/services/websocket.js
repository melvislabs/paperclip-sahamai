import { verifyAccessToken } from '../auth/utils.js';
const heartbeatInterval = 30_000;
const MAX_CONNECTIONS_PER_USER = 10;
export function registerWebSocketRoutes(app, store, nowProvider = () => Date.now()) {
    const clients = new Map();
    const userConnections = new Map();
    let clientIdCounter = 0;
    app.get('/v1/ws', { websocket: true }, (socket, request) => {
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
        }
        catch {
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
        const client = {
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
        socket.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                handleMessage(clientId, client, msg);
            }
            catch {
                sendToClient(client, { type: 'error', message: 'Invalid JSON message' });
            }
        });
        socket.on('close', () => {
            handleDisconnect(clientId, payload.userId);
        });
        socket.on('error', (error) => {
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
    function handleMessage(clientId, client, msg) {
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
    function handleSubscribe(clientId, client, msg) {
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
            }
            else {
                sendToClient(client, { type: 'error', message: `Cannot subscribe to channel: ${msg.channel}` });
            }
        }
    }
    function handleUnsubscribe(clientId, client, msg) {
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
            }
            else {
                sendToClient(client, { type: 'error', message: `Not subscribed to channel: ${msg.channel}` });
            }
        }
    }
    function isValidChannel(client, channel) {
        const parts = channel.split(':');
        if (parts.length < 2)
            return false;
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
    function handleDisconnect(clientId, userId) {
        clients.delete(clientId);
        const userConns = userConnections.get(userId);
        if (userConns) {
            userConns.delete(clientId);
            if (userConns.size === 0) {
                userConnections.delete(userId);
            }
        }
    }
    function sendToClient(client, message) {
        if (client.conn.readyState === 1) {
            client.conn.send(JSON.stringify(message));
        }
    }
    function broadcastToChannel(channel, message) {
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
        broadcastSignal(symbol, signal) {
            broadcastToChannel(`price:${symbol}`, {
                type: 'signal',
                symbol,
                action: signal.action,
                confidence: signal.confidence,
                generatedAt: signal.generatedAt,
            });
        },
        broadcastPrice(symbol, price) {
            broadcastToChannel(`price:${symbol}`, {
                type: 'price',
                symbol,
                ...price,
            });
        },
        broadcastAlert(userId, alert) {
            broadcastToChannel(`alert:${userId}`, {
                type: 'alert',
                data: {
                    ...alert,
                    triggeredAt: new Date(nowProvider()).toISOString(),
                },
            });
        },
        broadcastAnalysis(symbol, analysis) {
            broadcastToChannel(`analysis:${symbol}`, {
                type: 'analysis',
                data: {
                    symbol,
                    ...analysis,
                    timestamp: new Date(nowProvider()).toISOString(),
                },
            });
        },
        broadcastPortfolio(portfolioId, data) {
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
