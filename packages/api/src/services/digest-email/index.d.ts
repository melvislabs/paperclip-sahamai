export interface DigestContent {
    portfolioSummary: {
        totalValue: number;
        cashBalance: number;
        dayChange: number;
        dayChangePercent: number;
        topPerformers: Array<{
            symbol: string;
            change: number;
            changePercent: number;
        }>;
        worstPerformers: Array<{
            symbol: string;
            change: number;
            changePercent: number;
        }>;
    };
    aiHighlights: Array<{
        symbol: string;
        recommendation: string;
        confidence: number;
        summary: string;
    }>;
    marketOverview: {
        indices: Array<{
            name: string;
            value: number;
            change: number;
            changePercent: number;
        }>;
        notableMovers: Array<{
            symbol: string;
            name: string;
            changePercent: number;
        }>;
    };
    sentimentSummary: Array<{
        symbol: string;
        sentiment: string;
        score: number;
    }>;
    recommendations: Array<{
        symbol: string;
        action: string;
        reason: string;
    }>;
}
export interface DigestEmailOptions {
    sendEmail: (to: string, subject: string, html: string) => Promise<void>;
    getUserDigestPrefs: (userId: string) => Promise<DigestPreference | null>;
    getUserEmail: (userId: string) => Promise<string | null>;
    getDigestContent: (userId: string) => Promise<DigestContent>;
}
export interface DigestPreference {
    enabled: boolean;
    deliveryTime: string;
    timezone: string;
    includeAlerts: boolean;
    includeAnalysis: boolean;
    includeMarketSummary: boolean;
}
export interface DigestSendResult {
    userId: string;
    email: string;
    status: 'sent' | 'skipped' | 'failed';
    error?: string;
}
export declare class DigestEmailService {
    private opts;
    constructor(opts: DigestEmailOptions);
    sendDigest(userId: string): Promise<DigestSendResult>;
    sendBatchDigest(userIds: string[]): Promise<DigestSendResult[]>;
}
export declare const digestTemplates: {
    render(content: DigestContent, prefs: DigestPreference): string;
    renderMarketOverview(content: DigestContent): string;
    renderPortfolioSummary(summary: DigestContent["portfolioSummary"]): string;
    renderAIHighlights(highlights: DigestContent["aiHighlights"]): string;
    renderSentimentSummary(sentiments: DigestContent["sentimentSummary"]): string;
    renderRecommendations(recommendations: DigestContent["recommendations"]): string;
};
