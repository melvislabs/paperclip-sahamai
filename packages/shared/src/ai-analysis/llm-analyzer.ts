import type { LLMAnalysisRequest, LLMAnalysisResult } from './types.js';

export interface LLMProvider {
  analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult>;
}

export interface LLMProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

const SYSTEM_PROMPT = `You are a professional financial analyst specializing in Indonesian stock market (IHSG) analysis. 

Your role is to provide objective, data-driven analysis based on technical indicators and market sentiment.

IMPORTANT RULES:
- Always include risk disclaimers
- Base analysis ONLY on the provided data
- Do not make predictions beyond what the data supports
- Be concise and specific
- Output must be valid JSON matching the requested schema
- Never give financial advice - only analysis

RISK DISCLAIMER: This analysis is for informational purposes only and should not be considered financial advice. Always do your own research and consult with a licensed financial advisor before making investment decisions.`;

function buildUserPrompt(request: LLMAnalysisRequest): string {
  const { symbol, technicalAnalysis, sentimentScore, recentNews, priceHistory } = request;

  const latestPrice = priceHistory[priceHistory.length - 1];
  const priceChangePct = priceHistory.length >= 2
    ? ((latestPrice.close - priceHistory[priceHistory.length - 2].close) / priceHistory[priceHistory.length - 2].close * 100)
    : 0;
  const priceChangeStr = priceChangePct.toFixed(2);

  const techSummary = `
TECHNICAL ANALYSIS SUMMARY for ${symbol}:
- Current Price: ${latestPrice.close} (${priceChangePct > 0 ? '+' : ''}${priceChangeStr}%)
- RSI: ${technicalAnalysis.signals.rsi.value.toFixed(1)} (${technicalAnalysis.signals.rsi.interpretation})
- MACD Histogram: ${technicalAnalysis.signals.macd.value.toFixed(4)} (${technicalAnalysis.signals.macd.interpretation})
- Short-term Trend: ${technicalAnalysis.signals.trend.shortTerm}
- Medium-term Trend: ${technicalAnalysis.signals.trend.mediumTerm}
- Long-term Trend: ${technicalAnalysis.signals.trend.longTerm}
- Volatility: ${technicalAnalysis.signals.volatility.interpretation}
- Technical Bias: ${technicalAnalysis.summary.overallBias}
- Bullish Signals: ${technicalAnalysis.summary.bullishSignals}
- Bearish Signals: ${technicalAnalysis.summary.bearishSignals}
`;

  const sentimentSummary = `
SENTIMENT SCORE: ${sentimentScore > 0 ? 'POSITIVE' : sentimentScore < 0 ? 'NEGATIVE' : 'NEUTRAL'} (${sentimentScore.toFixed(2)})
`;

  const newsSummary = recentNews.length > 0
    ? `
RECENT NEWS:
${recentNews.slice(0, 5).map(n => `- ${n.headline} [${n.sentiment}: ${n.score.toFixed(2)}]`).join('\n')}
`
    : '\nNo recent news available.\n';

  return `Analyze ${symbol} based on the following data:
${techSummary}
${sentimentSummary}
${newsSummary}

Provide your analysis in the following JSON format:
{
  "summary": "Brief 2-3 sentence overall analysis",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "risks": ["Risk 1", "Risk 2"],
  "catalysts": ["Catalyst 1", "Catalyst 2"],
  "priceTarget": {
    "target": numeric_target_price,
    "timeframe": "1-3 months",
    "confidence": 0.0_to_1.0
  },
  "reasoning": "Detailed explanation of your analysis"
}

Remember to include appropriate risk disclaimers.`;
}

function parseLLMResponse(response: string): LLMAnalysisResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary ?? 'No summary available',
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      catalysts: Array.isArray(parsed.catalysts) ? parsed.catalysts : [],
      priceTarget: {
        target: parsed.priceTarget?.target ?? 0,
        timeframe: parsed.priceTarget?.timeframe ?? '1-3 months',
        confidence: Math.max(0, Math.min(1, parsed.priceTarget?.confidence ?? 0.5))
      },
      reasoning: parsed.reasoning ?? 'No reasoning provided'
    };
  } catch (error) {
    return {
      summary: 'Analysis parsing failed',
      keyInsights: ['Unable to parse LLM response'],
      risks: ['Analysis may be incomplete'],
      catalysts: [],
      priceTarget: {
        target: 0,
        timeframe: '1-3 months',
        confidence: 0
      },
      reasoning: `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export class OpenAIProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(options: LLMProviderOptions) {
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? 'gpt-4o-mini';
    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    this.maxTokens = options.maxTokens ?? 1000;
    this.temperature = options.temperature ?? 0.3;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(request) }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '{}';

      return parseLLMResponse(content);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenAI API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
}

export class MockLLMProvider implements LLMProvider {
  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    const { symbol, technicalAnalysis, sentimentScore } = request;
    const latestPrice = request.priceHistory[request.priceHistory.length - 1];

    const bias = technicalAnalysis.summary.overallBias;
    const priceChange = bias === 'BULLISH' ? 0.05 : bias === 'BEARISH' ? -0.05 : 0;
    const target = latestPrice.close * (1 + priceChange);

    return {
      summary: `Technical analysis for ${symbol} shows a ${bias.toLowerCase()} bias with RSI at ${technicalAnalysis.signals.rsi.value.toFixed(1)}.`,
      keyInsights: [
        `RSI indicates ${technicalAnalysis.signals.rsi.interpretation.toLowerCase()} conditions`,
        `MACD shows ${technicalAnalysis.signals.macd.interpretation.toLowerCase().replace('_', ' ')}`,
        `Overall technical bias is ${bias.toLowerCase()}`
      ],
      risks: [
        'Market volatility could impact price movement',
        'Technical analysis is not predictive of future performance'
      ],
      catalysts: [
        sentimentScore > 0.3 ? 'Positive market sentiment' : sentimentScore < -0.3 ? 'Negative market sentiment' : 'Neutral market sentiment',
        `Volume ${request.priceHistory[request.priceHistory.length - 1].volume > technicalAnalysis.indicators.volume.average ? 'above' : 'below'} average`
      ],
      priceTarget: {
        target: Math.round(target * 100) / 100,
        timeframe: '1-3 months',
        confidence: Math.abs(sentimentScore) * 0.5 + 0.3
      },
      reasoning: `Based on technical indicators showing ${bias.toLowerCase()} bias (${technicalAnalysis.summary.bullishSignals} bullish vs ${technicalAnalysis.summary.bearishSignals} bearish signals) and sentiment score of ${sentimentScore.toFixed(2)}, the analysis suggests ${bias === 'BULLISH' ? 'potential upside' : bias === 'BEARISH' ? 'potential downside' : 'neutral outlook'}. This is not financial advice.`
    };
  }
}

export class OllamaProvider implements LLMProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(options: LLMProviderOptions) {
    this.baseUrl = options.baseUrl ?? 'http://localhost:11434';
    this.model = options.model ?? 'llama3.2:3b';
    this.maxTokens = options.maxTokens ?? 1000;
    this.temperature = options.temperature ?? 0.3;
    this.timeoutMs = options.timeoutMs ?? 60000;
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(request)}`,
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.response ?? '{}';

      return parseLLMResponse(content);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
}

export class OpenRouterProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(options: LLMProviderOptions) {
    if (!options.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? 'anthropic/claude-3.5-sonnet';
    this.baseUrl = options.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.maxTokens = options.maxTokens ?? 1000;
    this.temperature = options.temperature ?? 0.3;
    this.timeoutMs = options.timeoutMs ?? 45000;
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://sahamai.com',
          'X-Title': 'Saham AI - Indonesian Stock Analysis'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(request) }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '{}';

      return parseLLMResponse(content);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
}

export class OpenCodeProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeoutMs: number;

  constructor(options: LLMProviderOptions) {
    if (!options.apiKey) {
      throw new Error('OpenCode API key is required');
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? 'opencode/claude-3.5-sonnet';
    this.baseUrl = options.baseUrl ?? 'https://api.opencode.ai/v1';
    this.maxTokens = options.maxTokens ?? 1000;
    this.temperature = options.temperature ?? 0.3;
    this.timeoutMs = options.timeoutMs ?? 45000;
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(request) }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenCode API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '{}';

      return parseLLMResponse(content);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenCode API request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
}

export interface FallbackLLMConfig {
  providers: Array<{
    provider: LLMProvider;
    name: string;
    priority: number;
  }>;
  enableFallback: boolean;
}

export class FallbackLLMProvider implements LLMProvider {
  private readonly config: FallbackLLMConfig;

  constructor(config: FallbackLLMConfig) {
    this.config = config;
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    if (!this.config.enableFallback || this.config.providers.length === 0) {
      throw new Error('No LLM providers configured');
    }

    const sortedProviders = [...this.config.providers].sort((a, b) => a.priority - b.priority);
    const errors: Array<{ name: string; error: Error }> = [];

    for (const { provider, name } of sortedProviders) {
      try {
        console.log(`Attempting LLM analysis with provider: ${name}`);
        const result = await provider.analyze(request);
        console.log(`LLM analysis successful with provider: ${name}`);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push({ name, error: errorObj });
        console.warn(`LLM provider ${name} failed:`, errorObj.message);
        
        continue;
      }
    }

    const errorMessages = errors.map(({ name, error }) => `${name}: ${error.message}`).join('; ');
    throw new Error(`All LLM providers failed. Errors: ${errorMessages}`);
  }

  getProviderStatus(): Array<{ name: string; priority: number; available: boolean }> {
    return this.config.providers.map(({ name, priority }) => ({
      name,
      priority,
      available: true
    }));
  }
}
