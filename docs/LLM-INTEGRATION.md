# LLM Integration Guide

> Multi-provider LLM integration with intelligent fallback for Saham AI  
> Version: 1.0.0 | Last Updated: 2026-04-05

## Overview

Saham AI supports multiple LLM providers with intelligent fallback capabilities to ensure reliable AI-powered stock analysis. The system automatically tries providers in priority order and gracefully degrades when providers are unavailable.

## Supported Providers

| Provider | API Key Required | Default Model | Timeout | Cost Efficiency | Use Case |
|----------|------------------|---------------|---------|----------------|-----------|
| **OpenAI** | Yes | `gpt-4` | 30s | Medium | Premium quality, fast response |
| **OpenRouter** | Yes | `anthropic/claude-3.5-sonnet` | 45s | High | Multi-model access via single API |
| **OpenCode** | Yes | `opencode/claude-3.5-sonnet` | 45s | High | Developer-focused AI service |
| **Ollama** | No | `llama3.2:3b` | 60s | Free | Local inference, no API costs |
| **Mock** | No | Rule-based | - | Free | Fallback for testing/outages |

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
OPENAI_MODEL=gpt-4

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-YOUR_OPENROUTER_API_KEY_HERE
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# OpenCode Configuration
OPENCODE_API_KEY=sk-op-YOUR_OPENCODE_API_KEY_HERE
OPENCODE_MODEL=opencode/claude-3.5-sonnet

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Fallback Configuration
LLM_FALLBACK_ENABLED=true
LLM_PROVIDER_PRIORITY=openai,openrouter,opencode,ollama,mock
```

### Provider Priority

The `LLM_PROVIDER_PRIORITY` variable defines the order in which providers are tried:

```bash
# Default priority (cost-optimized)
LLM_PROVIDER_PRIORITY=openai,openrouter,opencode,ollama,mock

# Cost-optimized priority
LLM_PROVIDER_PRIORITY=ollama,openrouter,opencode,openai,mock

# Quality-first priority
LLM_PROVIDER_PRIORITY=openai,openrouter,opencode,ollama,mock
```

## Usage Examples

### Basic Usage (Automatic Fallback)

```typescript
import { AIAnalysisService } from '@sahamai/shared';

// Automatically uses configured providers with fallback
const analysisService = new AIAnalysisService();
const result = await analysisService.analyze('BBCA', priceHistory, news);
```

### Custom Provider Configuration

```typescript
import { 
  FallbackLLMProvider, 
  OpenAIProvider, 
  OpenRouterProvider,
  OllamaProvider 
} from '@sahamai/shared';

const fallbackProvider = new FallbackLLMProvider({
  providers: [
    {
      provider: new OpenAIProvider({
        apiKey: 'sk-openai-key',
        model: 'gpt-4',
        timeoutMs: 30000
      }),
      name: 'openai',
      priority: 1
    },
    {
      provider: new OpenRouterProvider({
        apiKey: 'sk-or-key',
        model: 'anthropic/claude-3.5-sonnet',
        timeoutMs: 45000
      }),
      name: 'openrouter',
      priority: 2
    },
    {
      provider: new OllamaProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama3.2:3b',
        timeoutMs: 60000
      }),
      name: 'ollama',
      priority: 3
    }
  ],
  enableFallback: true
});

const analysisService = new AIAnalysisService({
  llmProvider: fallbackProvider
});
```

### Single Provider Usage

```typescript
import { OpenRouterProvider, AIAnalysisService } from '@sahamai/shared';

const openRouterProvider = new OpenRouterProvider({
  apiKey: 'sk-or-key',
  model: 'meta-llama/llama-3.1-70b-instruct'
});

const analysisService = new AIAnalysisService({
  llmProvider: openRouterProvider
});
```

## Provider Setup Guides

### OpenAI

1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Create Key**: Generate new API key with appropriate permissions
3. **Configure**: Set `OPENAI_API_KEY` environment variable
4. **Optional**: Customize model with `OPENAI_MODEL`

### OpenRouter

1. **Get API Key**: Visit [OpenRouter](https://openrouter.ai/keys)
2. **Choose Models**: Browse available models at [OpenRouter Models](https://openrouter.ai/models)
3. **Configure**: Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`
4. **Benefits**: Single API key for multiple model providers

### OpenCode

1. **Get API Key**: Visit [OpenCode](https://opencode.ai/api-keys)
2. **Sign Up**: Register for developer-focused AI service
3. **Configure**: Set `OPENCODE_API_KEY` and `OPENCODE_MODEL`
4. **Benefits**: Optimized for code and technical analysis

### Ollama (Free Local)

1. **Install Ollama**: Visit [Ollama Downloads](https://ollama.ai/download)
2. **Pull Model**: `ollama pull llama3.2:3b`
3. **Start Service**: `ollama serve` (runs on http://localhost:11434)
4. **Configure**: Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
5. **Benefits**: No API costs, full data privacy

## Error Handling & Fallback Behavior

### Fallback Logic

1. **Primary Provider**: First provider in priority list is tried
2. **Sequential Fallback**: If primary fails, try next provider
3. **Mock Fallback**: If all providers fail, use rule-based Mock provider
4. **Technical-only**: If even Mock fails, return technical-only analysis

### Error Types

| Error Type | Handling |
|------------|-----------|
| API Key Missing | Skip provider, try next |
| Network Timeout | Skip provider, try next |
| Rate Limit | Skip provider, try next |
| Invalid Response | Skip provider, try next |
| All Providers Fail | Use Mock provider → Technical-only |

### Monitoring

```typescript
import { getProviderInfo } from '@sahamai/shared';

const info = getProviderInfo();
console.log('Primary provider:', info.primaryProvider);
console.log('Fallback enabled:', info.fallbackEnabled);
console.log('Priority order:', info.priorityOrder);
console.log('Available providers:', info.availableProviders);
```

## Best Practices

### Cost Optimization

```bash
# Use free/local providers first
LLM_PROVIDER_PRIORITY=ollama,mock,openai,openrouter,opencode

# Limit expensive models to specific use cases
OPENAI_MODEL=gpt-4o-mini  # Instead of gpt-4
```

### Reliability

```bash
# Enable fallback for production
LLM_FALLBACK_ENABLED=true

# Include mock as ultimate fallback
LLM_PROVIDER_PRIORITY=openai,openrouter,opencode,ollama,mock
```

### Performance

```typescript
// Configure appropriate timeouts
const provider = new OpenAIProvider({
  timeoutMs: 30000  // 30 seconds for fast responses
});

const ollama = new OllamaProvider({
  timeoutMs: 60000  // 60 seconds for local inference
});
```

## Troubleshooting

### Common Issues

**Problem**: All providers failing
```bash
# Check API keys
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check Ollama
curl http://localhost:11434/api/tags
```

**Problem**: Slow fallback
```bash
# Reduce timeouts for faster failover
OPENAI_TIMEOUT_MS=15000
OPENROUTER_TIMEOUT_MS=20000
```

**Problem**: High costs
```bash
# Prioritize free providers
LLM_PROVIDER_PRIORITY=ollama,mock,openrouter,opencode,openai
```

### Debug Logging

```typescript
// Enable debug logging
process.env.LLM_DEBUG = 'true';

// Provider-specific logs will show:
// - Attempting LLM analysis with provider: openai
// - LLM analysis successful with provider: openai
// - LLM provider openai failed: timeout, trying next
```

## Integration Examples

### Express.js Integration

```typescript
import { AIAnalysisService } from '@sahamai/shared';

const analysisService = new AIAnalysisService();

app.post('/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { priceHistory, news } = req.body;
    
    const analysis = await analysisService.analyze(symbol, priceHistory, news);
    
    res.json({
      success: true,
      data: analysis,
      provider: analysis.metadata.modelUsed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Background Worker Integration

```typescript
import { createLLMProvider } from '@sahamai/shared';

const llmProvider = createLLMProvider();

async function processStockAnalysis(symbol: string) {
  try {
    const result = await llmProvider.analyze(request);
    console.log(`Analysis completed for ${symbol} using provider:`, result.provider);
  } catch (error) {
    console.error(`All LLM providers failed for ${symbol}:`, error);
    // Proceed with technical-only analysis
  }
}
```

## Migration Guide

### From Single Provider

**Before**:
```typescript
const analysisService = new AIAnalysisService({
  llmProvider: new OpenAIProvider({ apiKey: 'sk-key' })
});
```

**After**:
```typescript
// Automatic fallback with environment configuration
const analysisService = new AIAnalysisService();

// Or custom fallback configuration
const analysisService = new AIAnalysisService({
  llmProvider: new FallbackLLMProvider({
    providers: [/* ... */],
    enableFallback: true
  })
});
```

### Environment Migration

**Add to existing .env**:
```bash
# Existing
OPENAI_API_KEY=sk-your-key

# Add fallback configuration
LLM_FALLBACK_ENABLED=true
LLM_PROVIDER_PRIORITY=openai,ollama,mock

# Add optional providers
OPENROUTER_API_KEY=sk-or-key
OLLAMA_BASE_URL=http://localhost:11434
```

## Performance Metrics

### Response Times by Provider

| Provider | Avg Response Time | Success Rate |
|----------|------------------|---------------|
| OpenAI (gpt-4) | ~2-3s | 99.5% |
| OpenRouter (claude-3.5) | ~3-4s | 99.0% |
| OpenCode (claude-3.5) | ~3-4s | 98.8% |
| Ollama (llama3.2:3b) | ~5-8s | 95.0% |
| Mock | <1s | 100% |

### Cost Comparison

| Provider | Cost per 1M tokens (approx) |
|----------|---------------------------|
| OpenAI (gpt-4) | $30 |
| OpenRouter (claude-3.5) | $15 |
| OpenCode (claude-3.5) | $12 |
| Ollama | $0 (hardware cost only) |
| Mock | $0 |

## Support

For issues with LLM integration:

1. **Provider Issues**: Check respective provider documentation
2. **Configuration**: Verify environment variables and API keys
3. **Fallback Logic**: Review provider priority and timeout settings
4. **Performance**: Consider provider selection based on use case

See also: [API Documentation](./API-DOCUMENTATION.md), [Troubleshooting Guide](./TROUBLESHOOTING.md)
