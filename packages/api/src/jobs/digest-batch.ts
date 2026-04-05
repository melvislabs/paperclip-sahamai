import nodemailer from 'nodemailer';
import { getPrismaClient } from '../db/index.js';
import { DigestEmailService, type DigestContent, type DigestPreference as DigestPrefShape } from '../services/digest-email/index.js';
import { buildEmailConfig } from '../services/alerts/email-adapter.js';

export function formatTimeInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }
}

export function calendarDateInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
}

function deliveryWindowMatches(deliveryTime: string, now: Date, timeZone: string): boolean {
  const normalized = deliveryTime.trim();
  const current = formatTimeInTimezone(now, timeZone);
  if (current === normalized) return true;
  const [h, m] = normalized.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const target = h * 60 + m;
  const [ch, cm] = current.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(ch) || Number.isNaN(cm)) return false;
  const cur = ch * 60 + cm;
  return cur >= target && cur < target + 5;
}

function sentimentToAction(sentiment: string): 'BUY' | 'HOLD' | 'SELL' {
  if (sentiment === 'BULLISH') return 'BUY';
  if (sentiment === 'BEARISH') return 'SELL';
  return 'HOLD';
}

function sentimentScore(sentiment: string): number {
  if (sentiment === 'BULLISH') return 0.55;
  if (sentiment === 'BEARISH') return -0.55;
  return 0;
}

function mockMarketDigest(now: Date): DigestContent['marketOverview'] {
  const daySeed = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const ihsgBase = 7280;
  const ihsgChange = Math.round((seededRandom(daySeed) - 0.5) * 80 * 100) / 100;
  const ihsgValue = ihsgBase + ihsgChange;
  const ihsgChangePercent = Math.round((ihsgChange / ihsgBase) * 10000) / 100;
  return {
    indices: [
      { name: 'IHSG', value: Math.round(ihsgValue * 100) / 100, change: Math.round(ihsgChange * 100) / 100, changePercent: ihsgChangePercent },
      { name: 'LQ45', value: 985, change: 0, changePercent: 0 }
    ],
    notableMovers: [
      { symbol: 'BBCA', name: 'Bank Central Asia', changePercent: 1.2 },
      { symbol: 'TLKM', name: 'Telkom Indonesia', changePercent: -0.8 }
    ]
  };
}

async function buildDigestContent(userId: string): Promise<DigestContent> {
  const prisma = getPrismaClient();

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true }
  });

  let portfolioSummary: DigestContent['portfolioSummary'] = {
    totalValue: 0,
    cashBalance: 0,
    dayChange: 0,
    dayChangePercent: 0,
    topPerformers: [],
    worstPerformers: []
  };

  if (portfolio && portfolio.holdings.length > 0) {
    const symbols = portfolio.holdings.map((h) => h.symbol.toUpperCase());
    const stocks = await prisma.stock.findMany({
      where: { symbol: { in: symbols } },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 2 }
      }
    });
    const stockMap = new Map(stocks.map((s) => [s.symbol.toUpperCase(), s]));

    type Row = { symbol: string; dayGainLossPercent: number; dayGainLoss: number };
    const rows: Row[] = [];
    for (const h of portfolio.holdings) {
      const stock = stockMap.get(h.symbol.toUpperCase());
      const latestPrice = stock?.prices[0];
      const prevPrice = stock?.prices[1];
      const currentPrice = latestPrice ? Number(latestPrice.price) : Number(h.avgCostPrice);
      const prevDayPrice = prevPrice ? Number(prevPrice.price) : currentPrice;
      const quantity = h.quantity;
      const dayGainLoss = (currentPrice - prevDayPrice) * quantity;
      const dayGainLossPercent = prevDayPrice > 0 ? ((currentPrice - prevDayPrice) / prevDayPrice) * 100 : 0;
      rows.push({ symbol: h.symbol.toUpperCase(), dayGainLossPercent, dayGainLoss });
    }

    const cashBalance = Number(portfolio.cashBalance);
    let totalInvestedValue = 0;
    for (const h of portfolio.holdings) {
      const stock = stockMap.get(h.symbol.toUpperCase());
      const latestPrice = stock?.prices[0];
      const currentPrice = latestPrice ? Number(latestPrice.price) : Number(h.avgCostPrice);
      totalInvestedValue += currentPrice * h.quantity;
    }
    const totalValue = totalInvestedValue + cashBalance;
    const totalDayGainLoss = rows.reduce((s, r) => s + r.dayGainLoss, 0);
    const totalDayGainLossPercent = totalInvestedValue > 0 ? (totalDayGainLoss / totalInvestedValue) * 100 : 0;

    const sorted = [...rows].sort((a, b) => b.dayGainLossPercent - a.dayGainLossPercent);
    const topPerformers = sorted.filter((r) => r.dayGainLossPercent > 0).slice(0, 5).map((r) => ({
      symbol: r.symbol,
      change: r.dayGainLoss,
      changePercent: r.dayGainLossPercent
    }));
    const worstPerformers = sorted
      .filter((r) => r.dayGainLossPercent < 0)
      .reverse()
      .slice(0, 5)
      .map((r) => ({
        symbol: r.symbol,
        change: r.dayGainLoss,
        changePercent: r.dayGainLossPercent
      }));

    portfolioSummary = {
      totalValue,
      cashBalance,
      dayChange: totalDayGainLoss,
      dayChangePercent: totalDayGainLossPercent,
      topPerformers,
      worstPerformers
    };
  } else if (portfolio) {
    portfolioSummary = {
      totalValue: Number(portfolio.cashBalance),
      cashBalance: Number(portfolio.cashBalance),
      dayChange: 0,
      dayChangePercent: 0,
      topPerformers: [],
      worstPerformers: []
    };
  }

  const watchlist = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' }
  });
  const wlSymbols = watchlist.map((w) => w.symbol.toUpperCase());

  const stocksForAnalysis =
    wlSymbols.length > 0
      ? await prisma.stock.findMany({
          where: { symbol: { in: wlSymbols } },
          include: {
            analyses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        })
      : [];

  const aiHighlights: DigestContent['aiHighlights'] = [];
  const sentimentSummary: DigestContent['sentimentSummary'] = [];
  const recommendations: DigestContent['recommendations'] = [];
  const signalsSummary: DigestContent['signalsSummary'] = [];

  for (const stock of stocksForAnalysis) {
    const a = stock.analyses[0];
    if (!a) continue;
    const rec = sentimentToAction(a.sentiment);
    const summaryLine = a.summary.length > 160 ? `${a.summary.slice(0, 157)}…` : a.summary;
    aiHighlights.push({
      symbol: stock.symbol,
      recommendation: rec,
      confidence: a.confidence,
      summary: summaryLine
    });
    sentimentSummary.push({
      symbol: stock.symbol,
      sentiment: a.sentiment.toLowerCase(),
      score: sentimentScore(a.sentiment)
    });
    recommendations.push({
      symbol: stock.symbol,
      action: rec,
      reason: summaryLine
    });
    signalsSummary.push({
      symbol: stock.symbol,
      action: rec,
      confidence: a.confidence,
      reasons: a.reasoning ? [a.reasoning.slice(0, 120)] : [summaryLine]
    });
  }

  const now = new Date();
  return {
    portfolioSummary,
    aiHighlights,
    marketOverview: mockMarketDigest(now),
    sentimentSummary,
    recommendations,
    signalsSummary
  };
}

function createSendHtml(): ((to: string, subject: string, html: string) => Promise<void>) | null {
  const cfg = buildEmailConfig();
  if (!cfg) return null;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth
  });
  const from = cfg.from;
  return async (to: string, subject: string, html: string) => {
    await transporter.sendMail({ from, to, subject, html });
  };
}

export type DigestBatchStats = { sent: number; skipped: number; failed: number };

export async function runDigestEmailBatch(nowInput?: Date): Promise<DigestBatchStats> {
  const now = nowInput ?? new Date();
  const sendHtml = createSendHtml();
  if (!sendHtml) {
    console.warn('[digest] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS); skipping digest send');
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const prisma = getPrismaClient();
  const service = new DigestEmailService({
    sendEmail: sendHtml,
    getUserDigestPrefs: async (userId: string) => {
      const row = await prisma.digestPreference.findUnique({ where: { userId } });
      if (!row || !row.enabled) return null;
      const p: DigestPrefShape = {
        enabled: row.enabled,
        deliveryTime: row.deliveryTime,
        timezone: row.timezone,
        includeAlerts: row.includeAlerts,
        includeAnalysis: row.includeAnalysis,
        includeMarketSummary: row.includeMarketSummary
      };
      return p;
    },
    getUserEmail: async (userId: string) => {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      return u?.email ?? null;
    },
    getDigestContent: (userId: string) => buildDigestContent(userId)
  });

  const prefs = await prisma.digestPreference.findMany({
    where: { enabled: true },
    select: {
      userId: true,
      deliveryTime: true,
      timezone: true,
      lastDigestSentDate: true
    }
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const pref of prefs) {
    const tz = pref.timezone?.trim() || 'Asia/Jakarta';
    if (!deliveryWindowMatches(pref.deliveryTime, now, tz)) {
      skipped += 1;
      continue;
    }

    const today = calendarDateInTimezone(now, tz);
    if (pref.lastDigestSentDate === today) {
      skipped += 1;
      continue;
    }

    const result = await service.sendDigest(pref.userId);
    if (result.status === 'sent') {
      sent += 1;
      await prisma.digestPreference.update({
        where: { userId: pref.userId },
        data: { lastDigestSentDate: today }
      });
    } else if (result.status === 'failed') {
      failed += 1;
      console.warn('[digest] failed for user', pref.userId, result.error);
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped, failed };
}
