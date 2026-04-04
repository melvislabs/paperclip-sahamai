import type { FastifyInstance } from 'fastify';
import { SignalStore } from '@sahamai/shared';
export declare function registerWebSocketRoutes(app: FastifyInstance, store: SignalStore, nowProvider?: () => number): {
    broadcastSignal(symbol: string, signal: {
        action: string;
        confidence: number;
        generatedAt: string;
    }): void;
    broadcastPrice(symbol: string, price: {
        price: number;
        change: number;
        changePercent: number;
        volume: number;
    }): void;
    broadcastAlert(userId: string, alert: {
        id: string;
        symbol: string;
        condition: string;
        threshold: number;
        currentPrice: number;
    }): void;
    broadcastAnalysis(symbol: string, analysis: {
        recommendation: string;
        confidence: number;
        summary: string;
    }): void;
    broadcastPortfolio(portfolioId: string, data: {
        totalValue: number;
        cashBalance: number;
        change24h: number;
    }): void;
    getClientCount(): number;
};
