import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchAIAnalysisReport, fetchStockHistory } from '../lib/api';
import { Skeleton } from './Skeleton';
import type { AIAnalysisReport, PricePoint } from '../types';

interface AIAnalysisReportPageProps {
  symbol: string;
  onBack?: () => void;
}

export function AIAnalysisReportPage({ symbol, onBack }: AIAnalysisReportPageProps) {
  const [activeSection, setActiveSection] = useState<'technical' | 'llm' | 'sentiment'>('technical');

  const { data: report, isLoading: reportLoading, error: reportError } = useQuery<AIAnalysisReport>({
    queryKey: ['analysis-report', symbol],
    queryFn: () => fetchAIAnalysisReport(symbol),
    refetchInterval: 300_000,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<PricePoint[]>({
    queryKey: ['report-chart', symbol],
    queryFn: async () => {
      const res = await fetchStockHistory(symbol);
      return res.data.map((d) => ({
        timestamp: new Date(d.t).toISOString(),
        close: d.c,
        volume: d.v,
        open: d.o,
        high: d.h,
        low: d.l,
      }));
    },
    refetchInterval: 60_000,
  });

  if (reportLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton variant="text" className="w-24 h-6 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load analysis report</p>
          <p className="text-slate-400 text-sm">{reportError.message}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <p className="text-slate-400">No analysis report available for {symbol}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors text-sm"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'SELL': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-300 bg-slate-600/10 border-slate-500/30';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10';
      case 'CRITICAL': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-600/10';
    }
  };

  const chartPoints = chartData?.map((d) => ({
    time: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: d.close,
    volume: d.volume,
  })) || [];

  const sections = [
    { id: 'technical' as const, label: 'Technical' },
    { id: 'llm' as const, label: 'AI Analysis' },
    { id: 'sentiment' as const, label: 'Sentiment' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="text-2xl font-bold text-slate-100">{symbol}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(report.recommendation)}`}>
              {report.recommendation}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadgeColor(report.riskLevel)}`}>
              {report.riskLevel}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {report.analysisType} Analysis • Updated {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-cyan-400">{(report.confidence * 100).toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Confidence</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
        <p className="text-slate-200">{report.summary}</p>
        {report.keyPoints.length > 0 && (
          <ul className="mt-4 space-y-2">
            {report.keyPoints.map((point, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Chart */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Price History</h3>
        {chartLoading ? (
          <Skeleton className="h-64" />
        ) : chartPoints.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v: number) => `Rp ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Area type="monotone" dataKey="price" stroke="#06b6d4" fill="url(#reportColorPrice)" strokeWidth={2} />
                <defs>
                  <linearGradient id="reportColorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={chartPoints}>
                <Bar dataKey="volume" fill="#475569" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p className="text-sm">No price data available</p>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg mb-6 w-fit">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeSection === section.id
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeSection === 'technical' && report.technicalAnalysis && (
            <TechnicalSection analysis={report.technicalAnalysis} />
          )}
          {activeSection === 'llm' && report.llmAnalysis && (
            <LLMSection analysis={report.llmAnalysis} />
          )}
          {activeSection === 'sentiment' && report.sentimentFusion && (
            <SentimentSection sentiment={report.sentimentFusion} />
          )}
          {activeSection === 'technical' && !report.technicalAnalysis && (
            <EmptySection message="No technical analysis data available" />
          )}
          {activeSection === 'llm' && !report.llmAnalysis && (
            <EmptySection message="No AI analysis data available" />
          )}
          {activeSection === 'sentiment' && !report.sentimentFusion && (
            <EmptySection message="No sentiment data available" />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Analysis Metadata</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Model</span>
                <span className="text-slate-300">{report.metadata.modelUsed || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data Points</span>
                <span className="text-slate-300">{report.metadata.dataPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processing Time</span>
                <span className="text-slate-300">{report.metadata.processingTimeMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version</span>
                <span className="text-slate-300">{report.metadata.version}</span>
              </div>
            </div>
          </div>

          {/* Price Target */}
          {report.llmAnalysis?.priceTarget && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Price Target</h4>
              <p className="text-2xl font-bold text-cyan-400 mb-1">
                Rp {report.llmAnalysis.priceTarget.target.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-slate-500">{report.llmAnalysis.priceTarget.timeframe} timeframe</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Target Confidence</span>
                  <span className="text-slate-300">{(report.llmAnalysis.priceTarget.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${report.llmAnalysis.priceTarget.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Technical Signal Summary */}
          {report.technicalAnalysis?.summary && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Signal Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-500/10 rounded p-2">
                  <p className="text-lg font-bold text-emerald-400">{report.technicalAnalysis.summary.bullishSignals}</p>
                  <p className="text-[10px] text-slate-500">Bullish</p>
                </div>
                <div className="bg-slate-600/10 rounded p-2">
                  <p className="text-lg font-bold text-slate-300">{report.technicalAnalysis.summary.neutralSignals}</p>
                  <p className="text-[10px] text-slate-500">Neutral</p>
                </div>
                <div className="bg-red-500/10 rounded p-2">
                  <p className="text-lg font-bold text-red-400">{report.technicalAnalysis.summary.bearishSignals}</p>
                  <p className="text-[10px] text-slate-500">Bearish</p>
                </div>
              </div>
              <p className="text-xs text-center mt-2 text-slate-400">
                Overall: <span className="font-medium">{report.technicalAnalysis.summary.overallBias}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TechnicalSection({ analysis }: { analysis: NonNullable<AIAnalysisReport['technicalAnalysis']> }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Technical Indicators</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <IndicatorCard
            label="RSI"
            value={analysis.indicators.rsi.toFixed(1)}
            signal={analysis.signals.rsi.interpretation}
          />
          <IndicatorCard
            label="MACD"
            value={analysis.indicators.macd.histogram.toFixed(2)}
            signal={analysis.signals.macd.interpretation}
          />
          <IndicatorCard
            label="Trend"
            value={analysis.signals.trend.shortTerm}
            signal={`${analysis.signals.trend.mediumTerm} mid`}
          />
          <IndicatorCard
            label="SMA 20"
            value={analysis.indicators.sma.sma20?.toFixed(0) || 'N/A'}
            signal=""
          />
          <IndicatorCard
            label="SMA 50"
            value={analysis.indicators.sma.sma50?.toFixed(0) || 'N/A'}
            signal=""
          />
          <IndicatorCard
            label="Volatility"
            value={analysis.signals.volatility.interpretation}
            signal={analysis.signals.volatility.percentB ? `${(analysis.signals.volatility.percentB * 100).toFixed(0)}%` : ''}
          />
        </div>
      </div>

      {analysis.indicators.bollingerBands.upper && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Bollinger Bands</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Upper</p>
              <p className="text-lg font-medium text-slate-200">{analysis.indicators.bollingerBands.upper.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Middle</p>
              <p className="text-lg font-medium text-slate-200">{analysis.indicators.bollingerBands.middle?.toFixed(0) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Lower</p>
              <p className="text-lg font-medium text-slate-200">{analysis.indicators.bollingerBands.lower?.toFixed(0) || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LLMSection({ analysis }: { analysis: NonNullable<AIAnalysisReport['llmAnalysis']> }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">AI Analysis</h3>
        <p className="text-slate-200 mb-4">{analysis.summary}</p>
        <p className="text-sm text-slate-400 italic border-l-2 border-cyan-500/30 pl-3">{analysis.reasoning}</p>
      </div>

      {analysis.keyInsights.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Key Insights</h3>
          <ul className="space-y-2">
            {analysis.keyInsights.map((insight, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.catalysts.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wide mb-4">Catalysts</h3>
          <ul className="space-y-2">
            {analysis.catalysts.map((catalyst, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">↑</span>
                {catalyst}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.risks.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-sm font-medium text-red-400 uppercase tracking-wide mb-4">Risks</h3>
          <ul className="space-y-2">
            {analysis.risks.map((risk, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">⚠</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SentimentSection({ sentiment }: { sentiment: NonNullable<AIAnalysisReport['sentimentFusion']> }) {
  const scorePercent = ((sentiment.compositeScore + 1) / 2) * 100;

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Sentiment Fusion</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-cyan-400">{(sentiment.confidence * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">Confidence</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              sentiment.recommendation === 'BUY' ? 'text-emerald-400' :
              sentiment.recommendation === 'SELL' ? 'text-red-400' : 'text-slate-300'
            }`}>
              {sentiment.recommendation}
            </p>
            <p className="text-xs text-slate-500">Recommendation</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Composite Score</span>
            <span className="text-slate-300">{sentiment.compositeScore.toFixed(2)}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                sentiment.compositeScore > 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Contribution Breakdown</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Technical</span>
              <span className="text-slate-300">{(sentiment.breakdown.technicalContribution * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${sentiment.breakdown.technicalContribution * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Sentiment</span>
              <span className="text-slate-300">{(sentiment.breakdown.sentimentContribution * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sentiment.breakdown.sentimentContribution * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ label, value, signal }: { label: string; value: string; signal: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-medium text-slate-200">{value}</p>
      {signal && <p className="text-[10px] text-cyan-400 mt-0.5">{signal}</p>}
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
