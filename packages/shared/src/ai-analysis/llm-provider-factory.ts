import type { LLMProvider } from './llm-analyzer.js';
import { 
  OpenAIProvider, 
  OllamaProvider, 
  MockLLMProvider,
  OpenRouterProvider,
  OpenCodeProvider,
  FallbackLLMProvider,
  type FallbackLLMConfig 
} from './llm-analyzer.js';
import { getConfig } from '../config.js';

export function createLLMProvider(): LLMProvider {
  const config = getConfig();
  
  if (!config.LLM_FALLBACK_ENABLED) {
    const primaryProvider = config.LLM_PROVIDER_PRIORITY.split(',')[0]?.trim();
    
    switch (primaryProvider) {
      case 'openai':
        if (!config.OPENAI_API_KEY) {
          throw new Error('OpenAI API key is required when OpenAI is the primary provider');
        }
        return new OpenAIProvider({
          apiKey: config.OPENAI_API_KEY,
          model: config.OPENAI_MODEL,
          timeoutMs: 30000
        });
        
      case 'openrouter':
        if (!config.OPENROUTER_API_KEY) {
          throw new Error('OpenRouter API key is required when OpenRouter is the primary provider');
        }
        return new OpenRouterProvider({
          apiKey: config.OPENROUTER_API_KEY,
          model: config.OPENROUTER_MODEL,
          timeoutMs: 45000
        });
        
      case 'opencode':
        if (!config.OPENCODE_API_KEY) {
          throw new Error('OpenCode API key is required when OpenCode is the primary provider');
        }
        return new OpenCodeProvider({
          apiKey: config.OPENCODE_API_KEY,
          model: config.OPENCODE_MODEL,
          timeoutMs: 45000
        });
        
      case 'ollama':
        return new OllamaProvider({
          baseUrl: config.OLLAMA_BASE_URL,
          model: config.OLLAMA_MODEL,
          timeoutMs: 60000
        });
        
      case 'mock':
        return new MockLLMProvider();
        
      default:
        throw new Error(`Unknown LLM provider: ${primaryProvider}`);
    }
  }

  const providers: FallbackLLMConfig['providers'] = [];
  const priorityOrder = config.LLM_PROVIDER_PRIORITY.split(',').map(p => p.trim());
  
  priorityOrder.forEach((providerName, index) => {
    try {
      switch (providerName) {
        case 'openai':
          if (config.OPENAI_API_KEY) {
            providers.push({
              provider: new OpenAIProvider({
                apiKey: config.OPENAI_API_KEY,
                model: config.OPENAI_MODEL,
                timeoutMs: 30000
              }),
              name: 'openai',
              priority: index
            });
          }
          break;
          
        case 'openrouter':
          if (config.OPENROUTER_API_KEY) {
            providers.push({
              provider: new OpenRouterProvider({
                apiKey: config.OPENROUTER_API_KEY,
                model: config.OPENROUTER_MODEL,
                timeoutMs: 45000
              }),
              name: 'openrouter',
              priority: index
            });
          }
          break;
          
        case 'opencode':
          if (config.OPENCODE_API_KEY) {
            providers.push({
              provider: new OpenCodeProvider({
                apiKey: config.OPENCODE_API_KEY,
                model: config.OPENCODE_MODEL,
                timeoutMs: 45000
              }),
              name: 'opencode',
              priority: index
            });
          }
          break;
          
        case 'ollama':
          providers.push({
            provider: new OllamaProvider({
              baseUrl: config.OLLAMA_BASE_URL,
              model: config.OLLAMA_MODEL,
              timeoutMs: 60000
            }),
            name: 'ollama',
            priority: index
          });
          break;
          
        case 'mock':
          providers.push({
            provider: new MockLLMProvider(),
            name: 'mock',
            priority: index
          });
          break;
          
        default:
          console.warn(`Unknown LLM provider in priority list: ${providerName}`);
      }
    } catch (error) {
      console.warn(`Failed to initialize LLM provider ${providerName}:`, error);
    }
  });

  if (providers.length === 0) {
    throw new Error('No LLM providers could be initialized. Please check your configuration.');
  }

  return new FallbackLLMProvider({
    providers,
    enableFallback: true
  });
}

export function getProviderInfo(): {
  primaryProvider: string;
  fallbackEnabled: boolean;
  priorityOrder: string[];
  availableProviders: string[];
} {
  const config = getConfig();
  
  const priorityOrder = config.LLM_PROVIDER_PRIORITY.split(',').map(p => p.trim());
  const availableProviders: string[] = [];
  
  priorityOrder.forEach(providerName => {
    switch (providerName) {
      case 'openai':
        if (config.OPENAI_API_KEY) {
          availableProviders.push('openai');
        }
        break;
      case 'openrouter':
        if (config.OPENROUTER_API_KEY) {
          availableProviders.push('openrouter');
        }
        break;
      case 'opencode':
        if (config.OPENCODE_API_KEY) {
          availableProviders.push('opencode');
        }
        break;
      case 'ollama':
        availableProviders.push('ollama');
        break;
      case 'mock':
        availableProviders.push('mock');
        break;
    }
  });

  return {
    primaryProvider: priorityOrder[0] || 'mock',
    fallbackEnabled: config.LLM_FALLBACK_ENABLED,
    priorityOrder,
    availableProviders
  };
}
