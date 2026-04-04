export declare const SymbolParamSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
}>;
export declare const SymbolsQuerySchema: import("@sinclair/typebox").TObject<{
    symbols: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const PriceDataPointSchema: import("@sinclair/typebox").TObject<{
    timestamp: import("@sinclair/typebox").TString;
    open: import("@sinclair/typebox").TNumber;
    high: import("@sinclair/typebox").TNumber;
    low: import("@sinclair/typebox").TNumber;
    close: import("@sinclair/typebox").TNumber;
    volume: import("@sinclair/typebox").TNumber;
}>;
export declare const NewsItemSchema: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    url: import("@sinclair/typebox").TString;
    source: import("@sinclair/typebox").TString;
    publishedAt: import("@sinclair/typebox").TString;
    symbols: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const AnalysisBodySchema: import("@sinclair/typebox").TObject<{
    priceHistory: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        timestamp: import("@sinclair/typebox").TString;
        open: import("@sinclair/typebox").TNumber;
        high: import("@sinclair/typebox").TNumber;
        low: import("@sinclair/typebox").TNumber;
        close: import("@sinclair/typebox").TNumber;
        volume: import("@sinclair/typebox").TNumber;
    }>>;
    news: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        url: import("@sinclair/typebox").TString;
        source: import("@sinclair/typebox").TString;
        publishedAt: import("@sinclair/typebox").TString;
        symbols: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
}>;
export declare const SearchQuerySchema: import("@sinclair/typebox").TObject<{
    q: import("@sinclair/typebox").TString;
}>;
export declare const HistoryQuerySchema: import("@sinclair/typebox").TObject<{
    interval: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    from: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    to: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const RegisterBodySchema: import("@sinclair/typebox").TObject<{
    email: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
    role: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<{
        admin: "admin";
        user: "user";
        service: "service";
    }>>;
}>;
export declare const LoginBodySchema: import("@sinclair/typebox").TObject<{
    email: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
}>;
export declare const RefreshBodySchema: import("@sinclair/typebox").TObject<{
    refreshToken: import("@sinclair/typebox").TString;
}>;
export declare const CreateApiKeyBodySchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    role: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<{
        admin: "admin";
        user: "user";
        service: "service";
    }>>;
    expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ErrorSchema: import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
}>;
export declare const ValidationErrorSchema: import("@sinclair/typebox").TObject<{
    statusCode: import("@sinclair/typebox").TNumber;
    code: import("@sinclair/typebox").TString;
    error: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
}>;
export declare const SignalSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    action: import("@sinclair/typebox").TEnum<{
        buy: "buy";
        sell: "sell";
        hold: "hold";
    }>;
    confidence: import("@sinclair/typebox").TNumber;
    generatedAt: import("@sinclair/typebox").TString;
    expiresAt: import("@sinclair/typebox").TString;
    version: import("@sinclair/typebox").TString;
    reasonCodes: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export declare const SignalWithFreshnessSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    stale: import("@sinclair/typebox").TBoolean;
    status: import("@sinclair/typebox").TEnum<{
        fresh: "fresh";
        stale: "stale";
        missing: "missing";
    }>;
    signal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        symbol: import("@sinclair/typebox").TString;
        action: import("@sinclair/typebox").TEnum<{
            buy: "buy";
            sell: "sell";
            hold: "hold";
        }>;
        confidence: import("@sinclair/typebox").TNumber;
        generatedAt: import("@sinclair/typebox").TString;
        expiresAt: import("@sinclair/typebox").TString;
        version: import("@sinclair/typebox").TString;
        reasonCodes: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    }>>;
}>;
export declare const SignalListResponseSchema: import("@sinclair/typebox").TObject<{
    count: import("@sinclair/typebox").TNumber;
    staleCount: import("@sinclair/typebox").TNumber;
    data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        symbol: import("@sinclair/typebox").TString;
        stale: import("@sinclair/typebox").TBoolean;
        status: import("@sinclair/typebox").TEnum<{
            fresh: "fresh";
            stale: "stale";
            missing: "missing";
        }>;
        signal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            symbol: import("@sinclair/typebox").TString;
            action: import("@sinclair/typebox").TEnum<{
                buy: "buy";
                sell: "sell";
                hold: "hold";
            }>;
            confidence: import("@sinclair/typebox").TNumber;
            generatedAt: import("@sinclair/typebox").TString;
            expiresAt: import("@sinclair/typebox").TString;
            version: import("@sinclair/typebox").TString;
            reasonCodes: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        }>>;
    }>>;
}>;
export declare const SignalSummaryResponseSchema: import("@sinclair/typebox").TObject<{
    stale: import("@sinclair/typebox").TBoolean;
    status: import("@sinclair/typebox").TString;
    total: import("@sinclair/typebox").TNumber;
    freshCount: import("@sinclair/typebox").TNumber;
    staleCount: import("@sinclair/typebox").TNumber;
    generatedAt: import("@sinclair/typebox").TString;
    staleSymbols: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export declare const HealthResponseSchema: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TString;
    service: import("@sinclair/typebox").TString;
    now: import("@sinclair/typebox").TString;
}>;
export declare const TechnicalAnalysisResultSchema: import("@sinclair/typebox").TObject<{
    rsi: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    macd: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        macd: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        signal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        histogram: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    }>>;
    bollingerBands: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        upper: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        middle: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        lower: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    }>>;
    sma: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TNumber>>;
    ema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TNumber>>;
    trend: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    volatility: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    volumeAnalysis: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        averageVolume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        currentVolume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        volumeRatio: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    }>>;
}>;
export declare const LLMAnalysisResultSchema: import("@sinclair/typebox").TObject<{
    reasoning: import("@sinclair/typebox").TString;
    marketContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    risks: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    opportunities: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export declare const SentimentFusionResultSchema: import("@sinclair/typebox").TObject<{
    overallSentiment: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sentimentScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    newsImpact: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    keyThemes: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export declare const AIAnalysisResultSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    analysisType: import("@sinclair/typebox").TEnum<{
        TECHNICAL: "TECHNICAL";
        FUNDAMENTAL: "FUNDAMENTAL";
        SENTIMENT: "SENTIMENT";
        PORTFOLIO_RISK: "PORTFOLIO_RISK";
        DAILY_DIGEST: "DAILY_DIGEST";
    }>;
    recommendation: import("@sinclair/typebox").TEnum<{
        BUY: "BUY";
        HOLD: "HOLD";
        SELL: "SELL";
    }>;
    confidence: import("@sinclair/typebox").TNumber;
    riskLevel: import("@sinclair/typebox").TEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        CRITICAL: "CRITICAL";
    }>;
    technicalAnalysis: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        rsi: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        macd: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            macd: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            signal: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            histogram: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        }>>;
        bollingerBands: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            upper: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            middle: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            lower: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        }>>;
        sma: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TNumber>>;
        ema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TNumber>>;
        trend: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        volatility: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        volumeAnalysis: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            averageVolume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            currentVolume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            volumeRatio: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        }>>;
    }>>;
    llmAnalysis: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        reasoning: import("@sinclair/typebox").TString;
        marketContext: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        risks: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        opportunities: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    }>>;
    sentimentFusion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        overallSentiment: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sentimentScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        newsImpact: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        keyThemes: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    }>>;
    summary: import("@sinclair/typebox").TString;
    keyPoints: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TObject<{
        modelUsed: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        dataPoints: import("@sinclair/typebox").TNumber;
        processingTimeMs: import("@sinclair/typebox").TNumber;
        version: import("@sinclair/typebox").TString;
    }>;
}>;
export declare const QuoteResponseSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    price: import("@sinclair/typebox").TNumber;
    change: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    changePercent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    volume: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    timestamp: import("@sinclair/typebox").TString;
}>;
export declare const HistoryResponseSchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    interval: import("@sinclair/typebox").TString;
    data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        timestamp: import("@sinclair/typebox").TString;
        open: import("@sinclair/typebox").TNumber;
        high: import("@sinclair/typebox").TNumber;
        low: import("@sinclair/typebox").TNumber;
        close: import("@sinclair/typebox").TNumber;
        volume: import("@sinclair/typebox").TNumber;
    }>>;
}>;
export declare const NewsResponseSchema: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    url: import("@sinclair/typebox").TString;
    source: import("@sinclair/typebox").TString;
    publishedAt: import("@sinclair/typebox").TString;
    symbols: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>>;
export declare const SearchResponseSchema: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    exchange: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>>;
export declare const MetricsResponseSchema: import("@sinclair/typebox").TObject<{
    generatedAt: import("@sinclair/typebox").TString;
    http: import("@sinclair/typebox").TObject<{
        windowMinutes: import("@sinclair/typebox").TNumber;
        requests: import("@sinclair/typebox").TNumber;
        errors5xx: import("@sinclair/typebox").TNumber;
        errorRate: import("@sinclair/typebox").TNumber;
        avgLatencyMs: import("@sinclair/typebox").TNumber;
    }>;
    freshness: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNull, import("@sinclair/typebox").TObject<{
        total: import("@sinclair/typebox").TNumber;
        stale: import("@sinclair/typebox").TNumber;
        staleRate: import("@sinclair/typebox").TNumber;
        observedAt: import("@sinclair/typebox").TString;
    }>]>;
    delivery: import("@sinclair/typebox").TObject<{
        windowMinutes: import("@sinclair/typebox").TNumber;
        channels: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            channel: import("@sinclair/typebox").TString;
            attempts: import("@sinclair/typebox").TNumber;
            successRate: import("@sinclair/typebox").TNumber;
            p95LatencyMs: import("@sinclair/typebox").TNumber;
        }>>;
    }>;
    modelUsage: import("@sinclair/typebox").TObject<{
        windowMinutes: import("@sinclair/typebox").TNumber;
        promptTokens: import("@sinclair/typebox").TNumber;
        completionTokens: import("@sinclair/typebox").TNumber;
        costUsd: import("@sinclair/typebox").TNumber;
    }>;
}>;
export declare const AlertSchema: import("@sinclair/typebox").TObject<{
    code: import("@sinclair/typebox").TString;
    severity: import("@sinclair/typebox").TEnum<{
        info: "info";
        warning: "warning";
        critical: "critical";
    }>;
    message: import("@sinclair/typebox").TString;
    runbook: import("@sinclair/typebox").TString;
    triggeredAt: import("@sinclair/typebox").TString;
}>;
export declare const AlertsResponseSchema: import("@sinclair/typebox").TObject<{
    generatedAt: import("@sinclair/typebox").TString;
    count: import("@sinclair/typebox").TNumber;
    alerts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        code: import("@sinclair/typebox").TString;
        severity: import("@sinclair/typebox").TEnum<{
            info: "info";
            warning: "warning";
            critical: "critical";
        }>;
        message: import("@sinclair/typebox").TString;
        runbook: import("@sinclair/typebox").TString;
        triggeredAt: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare const SLODashboardResponseSchema: import("@sinclair/typebox").TObject<{
    generatedAt: import("@sinclair/typebox").TString;
    slo: import("@sinclair/typebox").TObject<{
        apiErrorRate: import("@sinclair/typebox").TNumber;
        apiLatencyAvgMs: import("@sinclair/typebox").TNumber;
        staleRate: import("@sinclair/typebox").TNumber;
    }>;
    channels: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        channel: import("@sinclair/typebox").TString;
        attempts: import("@sinclair/typebox").TNumber;
        successRate: import("@sinclair/typebox").TNumber;
        p95LatencyMs: import("@sinclair/typebox").TNumber;
    }>>;
    costs: import("@sinclair/typebox").TObject<{
        windowMinutes: import("@sinclair/typebox").TNumber;
        promptTokens: import("@sinclair/typebox").TNumber;
        completionTokens: import("@sinclair/typebox").TNumber;
        costUsd: import("@sinclair/typebox").TNumber;
    }>;
}>;
export declare const AuthResponseSchema: import("@sinclair/typebox").TObject<{
    user: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        email: import("@sinclair/typebox").TString;
        role: import("@sinclair/typebox").TString;
    }>;
    token: import("@sinclair/typebox").TString;
    refreshToken: import("@sinclair/typebox").TString;
}>;
export declare const ApiKeyResponseSchema: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        keyHash: import("@sinclair/typebox").TString;
        userId: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
        role: import("@sinclair/typebox").TString;
        createdAt: import("@sinclair/typebox").TString;
        expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    rawKey: import("@sinclair/typebox").TString;
}>;
export declare const PriceAlertSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    userId: import("@sinclair/typebox").TString;
    symbol: import("@sinclair/typebox").TString;
    condition: import("@sinclair/typebox").TEnum<{
        ABOVE: "ABOVE";
        BELOW: "BELOW";
        PERCENT_CHANGE: "PERCENT_CHANGE";
    }>;
    targetPrice: import("@sinclair/typebox").TNumber;
    isActive: import("@sinclair/typebox").TBoolean;
    alertType: import("@sinclair/typebox").TEnum<{
        ONE_TIME: "ONE_TIME";
        RECURRING: "RECURRING";
        EXPIRING: "EXPIRING";
    }>;
    expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
    triggeredAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
    notificationChannels: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    cooldownUntil: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
}>;
export declare const CreateAlertBodySchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    condition: import("@sinclair/typebox").TEnum<{
        ABOVE: "ABOVE";
        BELOW: "BELOW";
        PERCENT_CHANGE: "PERCENT_CHANGE";
    }>;
    targetPrice: import("@sinclair/typebox").TNumber;
    alertType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<{
        ONE_TIME: "ONE_TIME";
        RECURRING: "RECURRING";
        EXPIRING: "EXPIRING";
    }>>;
    expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    notificationChannels: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<{
        in_app: "in_app";
        email: "email";
        push: "push";
    }>>>;
}>;
export declare const UpdateAlertBodySchema: import("@sinclair/typebox").TObject<{
    targetPrice: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    isActive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    notificationChannels: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<{
        in_app: "in_app";
        email: "email";
        push: "push";
    }>>>;
    expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const AlertListResponseSchema: import("@sinclair/typebox").TObject<{
    count: import("@sinclair/typebox").TNumber;
    data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        userId: import("@sinclair/typebox").TString;
        symbol: import("@sinclair/typebox").TString;
        condition: import("@sinclair/typebox").TEnum<{
            ABOVE: "ABOVE";
            BELOW: "BELOW";
            PERCENT_CHANGE: "PERCENT_CHANGE";
        }>;
        targetPrice: import("@sinclair/typebox").TNumber;
        isActive: import("@sinclair/typebox").TBoolean;
        alertType: import("@sinclair/typebox").TEnum<{
            ONE_TIME: "ONE_TIME";
            RECURRING: "RECURRING";
            EXPIRING: "EXPIRING";
        }>;
        expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        triggeredAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        notificationChannels: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        cooldownUntil: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        createdAt: import("@sinclair/typebox").TString;
        updatedAt: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare const AlertHistoryResponseSchema: import("@sinclair/typebox").TObject<{
    count: import("@sinclair/typebox").TNumber;
    data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        userId: import("@sinclair/typebox").TString;
        symbol: import("@sinclair/typebox").TString;
        condition: import("@sinclair/typebox").TEnum<{
            ABOVE: "ABOVE";
            BELOW: "BELOW";
            PERCENT_CHANGE: "PERCENT_CHANGE";
        }>;
        targetPrice: import("@sinclair/typebox").TNumber;
        isActive: import("@sinclair/typebox").TBoolean;
        alertType: import("@sinclair/typebox").TEnum<{
            ONE_TIME: "ONE_TIME";
            RECURRING: "RECURRING";
            EXPIRING: "EXPIRING";
        }>;
        expiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        triggeredAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        notificationChannels: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        cooldownUntil: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>>;
        createdAt: import("@sinclair/typebox").TString;
        updatedAt: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare const UserProfileSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    email: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    role: import("@sinclair/typebox").TString;
    avatarUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
}>;
export declare const UpdateProfileBodySchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    avatarUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const PortfolioSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    userId: import("@sinclair/typebox").TString;
    totalValue: import("@sinclair/typebox").TNumber;
    cashBalance: import("@sinclair/typebox").TNumber;
    riskScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
}>;
export declare const HoldingSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    portfolioId: import("@sinclair/typebox").TString;
    symbol: import("@sinclair/typebox").TString;
    quantity: import("@sinclair/typebox").TNumber;
    avgCostPrice: import("@sinclair/typebox").TNumber;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
}>;
export declare const PortfolioWithHoldingsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    userId: import("@sinclair/typebox").TString;
    totalValue: import("@sinclair/typebox").TNumber;
    cashBalance: import("@sinclair/typebox").TNumber;
    riskScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
    holdings: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        portfolioId: import("@sinclair/typebox").TString;
        symbol: import("@sinclair/typebox").TString;
        quantity: import("@sinclair/typebox").TNumber;
        avgCostPrice: import("@sinclair/typebox").TNumber;
        createdAt: import("@sinclair/typebox").TString;
        updatedAt: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare const CreatePortfolioBodySchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    cashBalance: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export declare const UpdatePortfolioBodySchema: import("@sinclair/typebox").TObject<{
    cashBalance: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    riskScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export declare const AddHoldingBodySchema: import("@sinclair/typebox").TObject<{
    symbol: import("@sinclair/typebox").TString;
    quantity: import("@sinclair/typebox").TNumber;
    avgCostPrice: import("@sinclair/typebox").TNumber;
}>;
export declare const PortfolioListResponseSchema: import("@sinclair/typebox").TObject<{
    count: import("@sinclair/typebox").TNumber;
    data: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        userId: import("@sinclair/typebox").TString;
        totalValue: import("@sinclair/typebox").TNumber;
        cashBalance: import("@sinclair/typebox").TNumber;
        riskScore: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        createdAt: import("@sinclair/typebox").TString;
        updatedAt: import("@sinclair/typebox").TString;
    }>>;
}>;
