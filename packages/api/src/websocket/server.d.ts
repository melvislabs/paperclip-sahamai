import type { FastifyInstance } from 'fastify';
import { ChannelManager } from './channels.js';
import type { ServerMessage } from './types.js';
export declare class WebSocketServer {
    private clients;
    private userConnections;
    private channelManager;
    private heartbeatTimer;
    constructor();
    register(app: FastifyInstance): void;
    broadcastToChannel(channel: string, message: ServerMessage): void;
    sendToClient(clientId: string, message: ServerMessage): void;
    getChannelManager(): ChannelManager;
    getActiveConnectionCount(): number;
    private handleMessage;
    private handleSubscribe;
    private handleUnsubscribe;
    private handleDisconnect;
    private startHeartbeat;
    shutdown(): void;
}
