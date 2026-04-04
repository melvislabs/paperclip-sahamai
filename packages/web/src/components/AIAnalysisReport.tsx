import { useQuery } from '@tanstack/react-query';
import { fetchAIAnalysisReport } from '../lib/api';
import type { AIAnalysisReport } from '../types';

interface AIAnalysisReportPageProps {
  symbol?: string;
}

function getRecColor(rec: string) {
  switch (rec) {
    case 'BUY': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    case 'SELL': return 'text-red-400 bg-red-500/20 border-red-500/30';
    default: return 'text-slate-300 bg-slate-600/30 border-slate-500/30';
  }
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'LOW': return 'text-emerald-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'HIGH': return 'text-orange-400';
    case 'CRITICAL': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

function getRiskBg(risk: string) {
  switch (risk) {
    case 'LOW': return 'bg-emerald-500/20';
    case 'MEDIUM': return 'bg-yellow-500/20';
    case 'HIGH': return 'bg-orange-500/20';
    case 'CRITICAL': return 'bg-red-500/20';
    default: return 'bg-slate-600/30';
  }
}

function getInterpretationBadge(interpretation: string) {
  const colors: Record<string, string> = {
    'OVERBOUGHT': 'text-red-400 bg-red-500/20',
    'OVERSOLD': 'text-emerald-400 bg-emerald-500/20',
    'NEUTRAL': 'text-slate-400 bg-slate-600/30',
    'BULLISH_CROSSOVER': 'text-emerald-400 bg-emerald-500/20',
    'BEARISH_CROSSOVER': 'text-red-400 bg-red-500/20',
    'UP': 'text-emerald-400 bg-emerald-500/20',
    'DOWN': 'text-red-400 bg-red-500/20',
    'HIGH': 'text-orange-400 bg-orange-500/20',
    'NORMAL': 'text-slate-400 bg-slate-600/30',
    'LOW': 'text-blue-400 bg-blue-500/20',
    'BULLISH': 'text-emerald-400 bg-emerald-500/20',
    'BEARISH': 'text-red-400 bg-red-500/20',
  };
  return colors[interpretation] || 'text-slate-400 bg-slate-600/30';
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <summary className="px-6 py-4 cursor-pointer hover:bg-slate-750 transition-colors">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      </summary>
      <div className="px-6 pb-6 border-t border-slate-700 pt-4">
        {children}
      </div>
    </details>
  );
}

export function AIAnalysisReportPage({ symbol }: AIAnalysisReportPageProps) {
  const { data: report, isLoading, error } = useQuery<AIAnalysisReport>({
    queryKey: ['analysis-report', symbol],
    queryFn: () => fetchAIAnalysisReport(symbol!),
    enabled: !!symbol,
    refetchInterval: 300_000,
  });

  if (!symbol) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
          <p className="text-slate-400 text-lg mb-2">Select a stock to view analysis</p>
          <p className="text-slate-500 text-sm">Choose a symbol from the watchlist or dashboard to see its full AI analysis report</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-32 mb-4" />
            <div className="h-4 bg-slate-700 rounded w-full mb-2" />
            <div className="h-4 bg-slate-700 rounded w-3/4" />
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-48 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-slate-700 rounded" />
              <div className="h-16 bg-slate-700 rounded" />
              <div className="h-16 bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <p className="text-red-400 mb-2">Failed to load analysis report</p>
          <p className="text-slate-500 text-sm">{(error as Error).message}</p>
          <p className="text-slate-600 text-xs mt-2">No analysis data available for {symbol}. Run analysis first via the API.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <p className="text-slate-500 text-sm">No analysis data available for {symbol}</p>
        </div>
      </div>
    );
  }

  const ta = report.technicalAnalysis;
  const llm = report.llmAnalysis;
  const sf = report.sentimentFusion;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-100">{report.symbol}</h2>
              <span className={`text-sm px-3 py-1 rounded-full font-medium border ${getRecColor(report.recommendation)}`}>
                {report.recommendation}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskBg(report.riskLevel)} ${getRiskColor(report.riskLevel)}`}>
                {report.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {report.analysisType} Analysis • Generated: {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500">Confidence</span>
              <span className="text-xl font-bold text-slate-100">{(report.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  report.confidence > 0.7 ? 'bg-emerald-500' : report.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${report.confidence * 100}%` }}
              />
            </div>
            {report.priceTarget && (
              <p className="text-xs text-slate-400 mt-2">
                Target: <span className="text-slate-200 font-medium">{report.priceTarget.toLocaleString()}</span>
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-300">{report.summary}</p>

        {report.keyPoints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Key Points</h4>
            <ul className="space-y-1">
              {report.keyPoints.map((point, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-4 text-xs text-slate-500">
          {report.metadata.modelUsed && <span>Model: {report.metadata.modelUsed}</span>}
          <span>Data Points: {report.metadata.dataPoints}</span>
          <span>Processing: {report.metadata.processingTimeMs}ms</span>
          <span>Version: {report.metadata.version}</span>
        </div>
      </div>

      {/* Sentiment Fusion (if available) */}
      {sf && (
        <SectionCard title="Sentiment Fusion" defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <MetricBox
              label="Composite Score"
              value={sf.compositeScore.toFixed(2)}
              sub={sf.recommendation}
            />
            <MetricBox
              label="Fusion Confidence"
              value={`${(sf.confidence * 100).toFixed(0)}%`}
            />
            <MetricBox
              label="Technical Contribution"
              value={sf.breakdown.technicalContribution.toFixed(2)}
            />
            <MetricBox
              label="Sentiment Contribution"
              value={sf.breakdown.sentimentContribution.toFixed(2)}
            />
          </div>
        </SectionCard>
      )}

      {/* Technical Analysis */}
      {ta && (
        <SectionCard title="Technical Analysis" defaultOpen={true}>
          {/* Technical Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricBox
              label="Overall Bias"
              value={ta.summary.overallBias}
              sub={`${ta.summary.bullishSignals} bullish, ${ta.summary.bearishSignals} bearish, ${ta.summary.neutralSignals} neutral`}
            />
            <MetricBox
              label="RSI"
              value={ta.indicators.rsi.toFixed(1)}
              sub={ta.signals.rsi.interpretation}
            />
            <MetricBox
              label="MACD Histogram"
              value={ta.indicators.macd.histogram.toFixed(3)}
              sub={ta.signals.macd.interpretation.replace('_', ' ')}
            />
            <MetricBox
              label="Volatility"
              value={ta.signals.volatility.interpretation}
              sub={ta.signals.volatility.percentB ? `Percent B: ${ta.signals.volatility.percentB.toFixed(2)}` : undefined}
            />
          </div>

          {/* Trend Analysis */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Trend Analysis</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
                <p className="text-xs text-slate-500 mb-1">Short Term</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getInterpretationBadge(ta.signals.trend.shortTerm)}`}>
                  {ta.signals.trend.shortTerm}
                </span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
                <p className="text-xs text-slate-500 mb-1">Medium Term</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getInterpretationBadge(ta.signals.trend.mediumTerm)}`}>
                  {ta.signals.trend.mediumTerm}
                </span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
                <p className="text-xs text-slate-500 mb-1">Long Term</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getInterpretationBadge(ta.signals.trend.longTerm)}`}>
                  {ta.signals.trend.longTerm}
                </span>
              </div>
            </div>
          </div>

          {/* Moving Averages */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Moving Averages</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricBox label="SMA 20" value={ta.indicators.sma.sma20?.toFixed(2) ?? 'N/A'} />
              <MetricBox label="SMA 50" value={ta.indicators.sma.sma50?.toFixed(2) ?? 'N/A'} />
              <MetricBox label="SMA 200" value={ta.indicators.sma.sma200?.toFixed(2) ?? 'N/A'} />
              <MetricBox label="EMA 12" value={ta.indicators.ema.ema12?.toFixed(2) ?? 'N/A'} />
              <MetricBox label="EMA 26" value={ta.indicators.ema.ema26?.toFixed(2) ?? 'N/A'} />
            </div>
          </div>

          {/* Bollinger Bands */}
          {ta.indicators.bollingerBands.upper && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Bollinger Bands</h4>
              <div className="grid grid-cols-3 gap-3">
                <MetricBox label="Upper" value={ta.indicators.bollingerBands.upper.toFixed(2)} />
                <MetricBox label="Middle" value={ta.indicators.bollingerBands.middle!.toFixed(2)} />
                <MetricBox label="Lower" value={ta.indicators.bollingerBands.lower!.toFixed(2)} />
              </div>
            </div>
          )}

          {/* Volume */}
          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Volume Analysis</h4>
            <div className="grid grid-cols-3 gap-3">
              <MetricBox label="Current Volume" value={ta.indicators.volume.current.toLocaleString()} />
              <MetricBox label="Average Volume" value={ta.indicators.volume.average.toLocaleString()} />
              <MetricBox label="Volume Ratio" value={`${ta.indicators.volume.ratio.toFixed(2)}x`} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* LLM Analysis */}
      {llm && (
        <SectionCard title="AI Analysis" defaultOpen={true}>
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-200 mb-2">Summary</h4>
            <p className="text-sm text-slate-300">{llm.summary}</p>
          </div>

          {llm.keyInsights.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {llm.keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {llm.catalysts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-emerald-400 uppercase mb-3">Catalysts</h4>
              <ul className="space-y-2">
                {llm.catalysts.map((catalyst, i) => (
                  <li key={i} className="text-sm text-emerald-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">↑</span>
                    {catalyst}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {llm.risks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-red-400 uppercase mb-3">Risks</h4>
              <ul className="space-y-2">
                {llm.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {llm.priceTarget && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricBox
                label="Price Target"
                value={llm.priceTarget.target.toLocaleString()}
              />
              <MetricBox
                label="Timeframe"
                value={llm.priceTarget.timeframe}
              />
              <MetricBox
                label="Target Confidence"
                value={`${(llm.priceTarget.confidence * 100).toFixed(0)}%`}
              />
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase mb-2">Reasoning</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{llm.reasoning}</p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
