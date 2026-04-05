import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useDashboardStore } from '../store/dashboard-store';

interface UseRealTimeDataOptions {
  enabled?: boolean;
}

export function useRealTimeData(options: UseRealTimeDataOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { watchlist, selectedSymbol } = useDashboardStore();
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || undefined : undefined;

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'price':
        // Update stock quote cache
        queryClient.setQueryData(['stock-quote', message.symbol], {
          symbol: message.symbol,
          price: message.price,
          change: message.change,
          changePercent: message.changePercent,
          volume: message.volume,
          updatedAt: new Date().toISOString()
        });

        // Invalidate watchlist quotes query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['watchlist-quotes'] });
        break;

      case 'signal':
        // Update signals cache
        queryClient.invalidateQueries({ queryKey: ['signals'] });
        break;

      case 'analysis':
        // Update AI analysis cache
        queryClient.setQueryData(['ai-analysis', message.data.symbol], message.data);
        break;

      case 'portfolio':
        // Update portfolio summary
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        break;

      case 'alert':
        // Update alerts
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        break;

      default:
        break;
    }
  }, [queryClient]);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    token,
    onMessage: handleMessage,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // Subscribe to watchlist symbols and selected symbol
  useEffect(() => {
    if (!enabled || !isConnected || !token) return;

    const symbolsToSubscribe = [...watchlist];
    if (selectedSymbol && !symbolsToSubscribe.includes(selectedSymbol)) {
      symbolsToSubscribe.push(selectedSymbol);
    }

    if (symbolsToSubscribe.length > 0) {
      subscribe(symbolsToSubscribe);
    }

    // Subscribe to general channels
    subscribe(undefined, 'portfolio');
    subscribe(undefined, 'alerts');

    return () => {
      if (symbolsToSubscribe.length > 0) {
        unsubscribe(symbolsToSubscribe);
      }
      unsubscribe(undefined, 'portfolio');
      unsubscribe(undefined, 'alerts');
    };
  }, [enabled, isConnected, token, watchlist, selectedSymbol, subscribe, unsubscribe]);

  return {
    isConnected,
    isRealTimeEnabled: enabled && !!token,
  };
}
