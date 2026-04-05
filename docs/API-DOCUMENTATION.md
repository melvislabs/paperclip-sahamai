# API Documentation

> REST API endpoints for Saham AI stock analysis platform  
> Version: 1.0.0 | Last Updated: 2026-04-05

## Base URL

```
Development: http://localhost:3000
Production:  https://api.sahamai.com
```

## Authentication

### JWT Authentication (User endpoints)

```bash
# Include JWT token in Authorization header
Authorization: Bearer <jwt_token>
```

### API Key Authentication (Programmatic access)

```bash
# Include API key in X-API-Key header
X-API-Key: <api_key>
```

## Core Endpoints

### AI Analysis

#### Run Stock Analysis

```http
POST /v1/analysis/{symbol}
```

**Request Body:**
```json
{
  "priceHistory": [
    {
      "date": "2026-04-05",
      "open": 1250,
      "high": 1280,
      "low": 1245,
      "close": 1275,
      "volume": 1500000
    }
  ],
  "news": [
    {
      "headline": "BBCA Reports Q1 Earnings",
      "sentiment": "BULLISH",
      "score": 0.75,
      "publishedAt": "2026-04-05T10:00:00Z"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "symbol": "BBCA",
  "analysisType": "TECHNICAL",
  "timestamp": "2026-04-05T12:00:00Z",
  "technicalAnalysis": {
    "indicators": {
      "rsi": 65.2,
      "macd": {
        "macd": 12.5,
        "signal": 10.2,
        "histogram": 2.3
      },
      "sma": {
        "sma20": 1260,
        "sma50": 1245,
        "sma200": 1220
      },
      "ema": {
        "ema12": 1265,
        "ema26": 1250
      },
      "bollingerBands": {
        "upper": 1290,
        "middle": 1260,
        "lower": 1230
      },
      "volume": {
        "current": 1500000,
        "average": 1200000,
        "ratio": 1.25
      }
    },
    "signals": {
      "rsi": {
        "value": 65.2,
        "interpretation": "NEUTRAL"
      },
      "macd": {
        "value": 2.3,
        "interpretation": "BULLISH_CROSSOVER"
      },
      "trend": {
        "shortTerm": "UP",
        "mediumTerm": "UP",
        "longTerm": "NEUTRAL"
      },
      "volatility": {
        "interpretation": "NORMAL",
        "percentB": 0.65
      }
    },
    "summary": {
      "bullishSignals": 3,
      "bearishSignals": 1,
      "neutralSignals": 2,
      "overallBias": "BULLISH"
    }
  },
  "llmAnalysis": {
    "summary": "BBCA shows bullish momentum with RSI indicating neutral conditions...",
    "keyInsights": [
      "RSI suggests stock is not overbought",
      "MACD shows bullish crossover pattern",
      "Volume above average indicates strong interest"
    ],
    "risks": [
      "Market volatility could impact short-term performance",
      "RSI approaching overbought territory"
    ],
    "catalysts": [
      "Positive earnings sentiment",
      "Volume surge suggests institutional interest"
    ],
    "priceTarget": {
      "target": 1320,
      "timeframe": "1-3 months",
      "confidence": 0.75
    },
    "reasoning": "Based on technical indicators and market sentiment..."
  },
  "sentimentFusion": {
    "compositeScore": 0.68,
    "recommendation": "BUY",
    "confidence": 0.72,
    "breakdown": {
      "technicalContribution": 0.65,
      "sentimentContribution": 0.75
    }
  },
  "recommendation": "BUY",
  "confidence": 0.72,
  "riskLevel": "MEDIUM",
  "priceTarget": 1320,
  "summary": "Technical analysis for BBCA shows bullish bias...",
  "keyPoints": [
    "RSI: 65.2 (NEUTRAL)",
    "MACD: BULLISH_CROSSOVER",
    "Trend: UP short-term, UP medium-term"
  ],
  "metadata": {
    "modelUsed": "openai",
    "dataPoints": 30,
    "processingTimeMs": 1250,
    "version": "ai-analysis-v1"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request body",
  "details": "priceHistory is required and must be non-empty"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Analysis failed",
  "details": "All LLM providers unavailable"
}
```

#### Get Latest Analysis

```http
GET /v1/analysis/{symbol}/latest
```

**Response (200 OK):**
Same structure as analysis endpoint above, returns most recent cached analysis.

**Response (404 Not Found):**
```json
{
  "error": "Analysis not found",
  "details": "No analysis available for symbol BBCA"
}
```

### Stock Data

#### Get Real-time Quote

```http
GET /v1/stocks/{symbol}/quote
```

**Response (200 OK):**
```json
{
  "symbol": "BBCA",
  "price": 1275,
  "change": 25,
  "changePercent": 2.0,
  "volume": 1500000,
  "timestamp": "2026-04-05T12:00:00Z"
}
```

#### Get Historical Data

```http
GET /v1/stocks/{symbol}/history?period=1d&interval=1h
```

**Query Parameters:**
- `period`: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
- `interval`: 1m, 5m, 15m, 1h, 1d

**Response (200 OK):**
```json
{
  "symbol": "BBCA",
  "period": "1d",
  "interval": "1h",
  "data": [
    {
      "date": "2026-04-05T09:00:00Z",
      "open": 1250,
      "high": 1280,
      "low": 1245,
      "close": 1275,
      "volume": 1500000
    }
  ]
}
```

#### Get Stock News

```http
GET /v1/stocks/{symbol}/news?limit=10
```

**Response (200 OK):**
```json
{
  "symbol": "BBCA",
  "news": [
    {
      "headline": "BBCA Reports Q1 Earnings Beat",
      "sentiment": "BULLISH",
      "score": 0.85,
      "publishedAt": "2026-04-05T08:00:00Z",
      "source": "Reuters",
      "url": "https://example.com/news/bbca-earnings"
    }
  ]
}
```

#### Search Stocks

```http
GET /v1/stocks/search?q=BCA&limit=5
```

**Response (200 OK):**
```json
{
  "query": "BCA",
  "results": [
    {
      "symbol": "BBCA",
      "name": "Bank Central Asia",
      "sector": "Banking",
      "marketCap": 850000000000
    }
  ]
}
```

### Signals

#### Get Latest Signal

```http
GET /v1/signals/latest/{symbol}
```

**Response (200 OK):**
```json
{
  "symbol": "BBCA",
  "action": "BUY",
  "confidence": 0.75,
  "generatedAt": "2026-04-05T12:00:00Z",
  "expiresAt": "2026-04-05T12:05:00Z",
  "version": "signal-v1",
  "reasonCodes": ["RSI_NEUTRAL", "MACD_BULLISH", "VOLUME_HIGH"]
}
```

**Response (404 Not Found):**
```json
{
  "error": "Signal not found",
  "details": "No signal available for symbol BBCA"
}
```

**Response (503 Service Unavailable):**
```json
{
  "error": "Signal stale",
  "details": "Signal for BBCA has expired"
}
```

#### Get Batch Signals

```http
GET /v1/signals/latest?symbols=BBCA,TLKM,BBRI
```

**Response (200 OK):**
```json
{
  "signals": {
    "BBCA": {
      "symbol": "BBCA",
      "action": "BUY",
      "confidence": 0.75,
      "status": "fresh"
    },
    "TLKM": {
      "symbol": "TLKM",
      "action": "HOLD",
      "confidence": 0.60,
      "status": "fresh"
    },
    "BBRI": {
      "symbol": "BBRI",
      "action": "SELL",
      "confidence": 0.45,
      "status": "stale"
    }
  },
  "summary": {
    "total": 3,
    "fresh": 2,
    "stale": 1,
    "missing": 0
  }
}
```

#### Get Signals Summary

```http
GET /v1/signals/summary/latest
```

**Response (200 OK):**
```json
{
  "totalSignals": 150,
  "freshSignals": 142,
  "staleSignals": 8,
  "freshnessRate": 0.947,
  "lastUpdated": "2026-04-05T12:00:00Z"
}
```

## LLM Provider Information

### Get Provider Status

```http
GET /v1/llm/providers/status
```

**Response (200 OK):**
```json
{
  "primaryProvider": "openai",
  "fallbackEnabled": true,
  "priorityOrder": ["openai", "openrouter", "opencode", "ollama", "mock"],
  "availableProviders": ["openai", "openrouter", "ollama", "mock"],
  "providerStatus": [
    {
      "name": "openai",
      "priority": 1,
      "available": true,
      "lastUsed": "2026-04-05T11:55:00Z"
    },
    {
      "name": "openrouter",
      "priority": 2,
      "available": true,
      "lastUsed": null
    },
    {
      "name": "opencode",
      "priority": 3,
      "available": false,
      "reason": "API key not configured"
    },
    {
      "name": "ollama",
      "priority": 4,
      "available": true,
      "lastUsed": null
    },
    {
      "name": "mock",
      "priority": 5,
      "available": true,
      "lastUsed": null
    }
  ]
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details",
  "timestamp": "2026-04-05T12:00:00Z",
  "requestId": "req_123456789"
}
```

### HTTP Status Codes

| Status | Meaning | When to Use |
|---------|---------|-------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters/body |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server | Unexpected server error |
| 502 | Bad Gateway | Upstream service failure |
| 503 | Service Unavailable | Service temporarily unavailable |

### LLM-Specific Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| LLM_001 | All providers failed | Check API keys, network connectivity |
| LLM_002 | Provider timeout | Increase timeout or try different provider |
| LLM_003 | Invalid API response | Check model compatibility |
| LLM_004 | Rate limit exceeded | Wait or upgrade plan |
| LLM_005 | Insufficient credits | Add credits or change provider |

## Rate Limiting

### Default Limits

| Endpoint | Rate Limit | Window |
|----------|-------------|---------|
| All endpoints | 100 requests | per minute |
| Analysis endpoint | 10 requests | per minute |
| Real-time data | 60 requests | per minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641234567
```

## WebSocket API

### Connect to Real-time Updates

```javascript
const ws = new WebSocket('ws://localhost:3000/v1/ws');

ws.onopen = function() {
  // Subscribe to symbol updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbols: ['BBCA', 'TLKM']
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'signal':
      console.log('New signal:', data.payload);
      break;
    case 'quote':
      console.log('Price update:', data.payload);
      break;
    case 'analysis':
      console.log('Analysis complete:', data.payload);
      break;
  }
};
```

### WebSocket Message Types

#### Signal Update
```json
{
  "type": "signal",
  "symbol": "BBCA",
  "payload": {
    "action": "BUY",
    "confidence": 0.75,
    "timestamp": "2026-04-05T12:00:00Z"
  }
}
```

#### Quote Update
```json
{
  "type": "quote",
  "symbol": "BBCA",
  "payload": {
    "price": 1275,
    "change": 25,
    "volume": 1500000,
    "timestamp": "2026-04-05T12:00:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { SahamAI } from '@sahamai/client';

const client = new SahamAI({
  baseURL: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Run analysis
const analysis = await client.analyze('BBCA', {
  priceHistory: [...],
  news: [...]
});

// Get real-time quote
const quote = await client.getQuote('BBCA');

// Subscribe to real-time updates
client.subscribe(['BBCA', 'TLKM'], (data) => {
  console.log('Real-time update:', data);
});
```

### Python

```python
from sahamai import SahamAI

client = SahamAI(
    base_url='http://localhost:3000',
    api_key='your-api-key'
)

# Run analysis
analysis = client.analyze('BBCA', {
    'price_history': [...],
    'news': [...]
})

# Get real-time quote
quote = client.get_quote('BBCA')
```

### cURL

```bash
# Run analysis
curl -X POST http://localhost:3000/v1/analysis/BBCA \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "priceHistory": [...],
    "news": [...]
  }'

# Get latest quote
curl -X GET http://localhost:3000/v1/stocks/BBCA/quote \
  -H "X-API-Key: your-api-key"

# Get signals
curl -X GET "http://localhost:3000/v1/signals/latest?symbols=BBCA,TLKM" \
  -H "X-API-Key: your-api-key"
```

## Testing

### Health Check

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-05T12:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "llm_providers": "healthy",
    "stock_apis": "healthy"
  }
}
```

### Smoke Tests

```bash
# Test core functionality
npm run smoke:runtime

# Test with specific provider
LLM_PROVIDER_PRIORITY=ollama npm run smoke:runtime

# Test fallback behavior
OPENAI_API_KEY=invalid npm run smoke:runtime
```

## Versioning

### API Versioning

- Current version: `v1`
- Version in URL path: `/v1/...`
- Backward compatibility maintained within major version
- Breaking changes increment major version

### Changelog

#### v1.0.0 (2026-04-05)
- Multi-provider LLM integration with fallback
- OpenRouter and OpenCode provider support
- Ollama local LLM support
- Enhanced error handling and monitoring
- WebSocket real-time updates
- Comprehensive authentication options

## Support

For API support:

1. **Documentation**: [LLM Integration Guide](./LLM-INTEGRATION.md)
2. **Status Page**: https://status.sahamai.com
3. **GitHub Issues**: https://github.com/sahamai/issues
4. **Email**: api-support@sahamai.com

## Related Documentation

- [LLM Integration Guide](./LLM-INTEGRATION.md)
- [Specification & Requirements](./SPEC-REQUIREMENTS.md)
- [Project Overview](./PROJECT-OVERVIEW.md)
- [Agent Guide](../AGENTS.md)
