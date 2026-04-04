import type { AIInsight } from '../types';

interface AIInsightsProps {
  insights?: AIInsight[];
  loading?: boolean;
  onSymbolSelect?: (symbol: string) => void;
}

export function AIInsights({ insights, loading, onSymbolSelect }: AIInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
            <div className="h-3 bg-slate-700 rounded w-full mb-2" />
            <div className="h-3 bg-slate-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <p className="text-slate-500 text-sm">No AI insights available</p>
        <p className="text-slate-600 text-xs mt-1">Run analysis on a stock to see insights here</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-400 bg-emerald-500/20';
      case 'bearish': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-600/50';
    }
  };

  const getRecColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'text-emerald-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <div
          key={insight.symbol}
          className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-semibold text-slate-100">{insight.symbol}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(insight.sentiment)}`}>
                  {insight.sentiment}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generated: {new Date(insight.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getRecColor(insight.recommendation)}`}>
                {insight.recommendation}
              </p>
              <p className="text-xs text-slate-400">
                Confidence: {(insight.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">Risk:</span>
              <span className={`text-xs font-medium ${getRiskColor(insight.riskLevel)}`}>
                {insight.riskLevel}
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  insight.confidence > 0.7
                    ? 'bg-emerald-500'
                    : insight.confidence > 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${insight.confidence * 100}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-4">{insight.summary}</p>

          {insight.keyPoints.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-slate-400 uppercase mb-2">Key Points</h5>
              <ul className="space-y-1">
                {insight.keyPoints.slice(0, 3).map((point, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.technicalIndicators && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-500">RSI</p>
                <p className="text-sm font-medium text-slate-200">
                  {insight.technicalIndicators.rsi.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">MACD</p>
                <p className="text-sm font-medium text-slate-200">
                  {insight.technicalIndicators.macd.histogram.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">SMA 20/50</p>
                <p className="text-sm font-medium text-slate-200">
                  {insight.technicalIndicators.sma20.toFixed(0)} / {insight.technicalIndicators.sma50.toFixed(0)}
                </p>
              </div>
            </div>
          )}

          {onSymbolSelect && (
            <button
              onClick={() => onSymbolSelect(insight.symbol)}
              className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View full analysis →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
