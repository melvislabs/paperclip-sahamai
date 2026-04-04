import type { UserRole } from '../auth/types.js';
export type ChannelType = 'price' | 'alert' | 'analysis' | 'portfolio';
export interface WsMessage {
    type: string;
    payload?: Record<string, unknown>;
}
export interface WsClient {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
    channels: Set<string>;
    connectedAt: number;
    lastPingAt: number;
}
export interface ChannelSubscription {
    channel: string;
    clientIds: Set<string>;
}
export interface PriceUpdate {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: string;
}
export interface AlertNotification {
    id: string;
    symbol: string;
    condition: string;
    threshold: number;
    currentPrice: number;
    triggeredAt: string;
}
export interface AnalysisResult {
    symbol: string;
    recommendation: string;
    confidence: number;
    summary: string;
    timestamp: string;
}
export interface PortfolioUpdate {
    portfolioId: string;
    totalValue: number;
    cashBalance: number;
    change24h: number;
    timestamp: string;
}
export type ServerMessage = {
    type: 'price';
    data: PriceUpdate;
} | {
    type: 'alert';
    data: AlertNotification;
} | {
    type: 'analysis';
    data: AnalysisResult;
} | {
    type: 'portfolio';
    data: PortfolioUpdate;
} | {
    type: 'pong';
} | {
    type: 'error';
    message: string;
} | {
    type: 'subscribed';
    channel: string;
} | {
    type: 'unsubscribed';
    channel: string;
};
