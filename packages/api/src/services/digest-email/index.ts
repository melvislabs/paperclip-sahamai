export interface DigestContent {
  portfolioSummary: {
    totalValue: number;
    cashBalance: number;
    dayChange: number;
    dayChangePercent: number;
    topPerformers: Array<{ symbol: string; change: number; changePercent: number }>;
    worstPerformers: Array<{ symbol: string; change: number; changePercent: number }>;
  };
  aiHighlights: Array<{
    symbol: string;
    recommendation: string;
    confidence: number;
    summary: string;
  }>;
  marketOverview: {
    indices: Array<{ name: string; value: number; change: number; changePercent: number }>;
    notableMovers: Array<{ symbol: string; name: string; changePercent: number }>;
  };
  sentimentSummary: Array<{
    symbol: string;
    sentiment: string;
    score: number;
  }>;
  recommendations: Array<{
    symbol: string;
    action: string;
    reason: string;
  }>;
}

export interface DigestEmailOptions {
  sendEmail: (to: string, subject: string, html: string) => Promise<void>;
  getUserDigestPrefs: (userId: string) => Promise<DigestPreference | null>;
  getUserEmail: (userId: string) => Promise<string | null>;
  getDigestContent: (userId: string) => Promise<DigestContent>;
}

export interface DigestPreference {
  enabled: boolean;
  deliveryTime: string;
  timezone: string;
  includeAlerts: boolean;
  includeAnalysis: boolean;
  includeMarketSummary: boolean;
}

export interface DigestSendResult {
  userId: string;
  email: string;
  status: 'sent' | 'skipped' | 'failed';
  error?: string;
}

export class DigestEmailService {
  private opts: DigestEmailOptions;

  constructor(opts: DigestEmailOptions) {
    this.opts = opts;
  }

  async sendDigest(userId: string): Promise<DigestSendResult> {
    const prefs = await this.opts.getUserDigestPrefs(userId);
    if (!prefs || !prefs.enabled) {
      return { userId, email: '', status: 'skipped' };
    }

    const email = await this.opts.getUserEmail(userId);
    if (!email) {
      return { userId, email: '', status: 'skipped', error: 'No email address' };
    }

    try {
      const content = await this.opts.getDigestContent(userId);
      const html = digestTemplates.render(content, prefs);
      const subject = `Saham AI Daily Digest - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

      await this.opts.sendEmail(email, subject, html);
      return { userId, email, status: 'sent' };
    } catch (error) {
      return {
        userId,
        email,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendBatchDigest(userIds: string[]): Promise<DigestSendResult[]> {
    const results: DigestSendResult[] = [];

    for (const userId of userIds) {
      const result = await this.sendDigest(userId);
      results.push(result);
    }

    return results;
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
}

export const digestTemplates = {
  render(content: DigestContent, prefs: DigestPreference): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saham AI Daily Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:600;">Saham AI</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Daily Digest</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${prefs.includeMarketSummary ? this.renderMarketOverview(content) : ''}
              ${this.renderPortfolioSummary(content.portfolioSummary)}
              ${prefs.includeAnalysis ? this.renderAIHighlights(content.aiHighlights) : ''}
              ${this.renderSentimentSummary(content.sentimentSummary)}
              ${this.renderRecommendations(content.recommendations)}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <a href="${process.env.APP_URL || 'https://sahamai.app'}/dashboard" style="display:inline-block;padding:12px 32px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View Full Dashboard</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f8fafc;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Manage your digest preferences at <a href="${process.env.APP_URL || 'https://sahamai.app'}/settings/digest" style="color:#3b82f6;text-decoration:none;">Settings</a> | <a href="${process.env.APP_URL || 'https://sahamai.app'}/unsubscribe" style="color:#3b82f6;text-decoration:none;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },

  renderMarketOverview(content: DigestContent): string {
    return `<div style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Market Overview</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${content.marketOverview.indices.map((idx, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:10px 16px;color:#0f172a;font-size:14px;font-weight:500;">${idx.name}</td>
          <td style="padding:10px 16px;color:#0f172a;font-size:14px;text-align:right;">${formatCurrency(idx.value)}</td>
          <td style="padding:10px 16px;color:${idx.change >= 0 ? '#16a34a' : '#dc2626'};font-size:14px;font-weight:500;text-align:right;">${idx.change >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%</td>
        </tr>`).join('')}
      </table>
      ${content.marketOverview.notableMovers.length > 0 ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#64748b;">Notable Movers</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${content.marketOverview.notableMovers.map((mover, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:8px 16px;color:#0f172a;font-size:14px;font-weight:500;">${mover.symbol}</td>
          <td style="padding:8px 16px;color:#64748b;font-size:14px;">${mover.name}</td>
          <td style="padding:8px 16px;color:${mover.changePercent >= 0 ? '#16a34a' : '#dc2626'};font-size:14px;font-weight:500;text-align:right;">${mover.changePercent >= 0 ? '+' : ''}${mover.changePercent.toFixed(2)}%</td>
        </tr>`).join('')}
      </table>` : ''}
    </div>`;
  },

  renderPortfolioSummary(summary: DigestContent['portfolioSummary']): string {
    return `<div style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Portfolio Summary</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <tr style="background-color:#f8fafc;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Total Value</td>
          <td style="padding:12px 16px;color:#0f172a;font-size:16px;font-weight:600;text-align:right;">${formatCurrency(summary.totalValue)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Cash Balance</td>
          <td style="padding:12px 16px;color:#0f172a;font-size:14px;text-align:right;">${formatCurrency(summary.cashBalance)}</td>
        </tr>
        <tr style="background-color:#f8fafc;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Day Change</td>
          <td style="padding:12px 16px;color:${summary.dayChange >= 0 ? '#16a34a' : '#dc2626'};font-size:14px;font-weight:500;text-align:right;">${summary.dayChange >= 0 ? '+' : ''}${formatCurrency(summary.dayChange)} (${summary.dayChangePercent >= 0 ? '+' : ''}${summary.dayChangePercent.toFixed(2)}%)</td>
        </tr>
      </table>
      ${summary.topPerformers.length > 0 ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#16a34a;">Top Performers</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${summary.topPerformers.map((p, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:8px 16px;color:#0f172a;font-size:14px;font-weight:500;">${p.symbol}</td>
          <td style="padding:8px 16px;color:#16a34a;font-size:14px;font-weight:500;text-align:right;">+${p.changePercent.toFixed(2)}%</td>
        </tr>`).join('')}
      </table>` : ''}
      ${summary.worstPerformers.length > 0 ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#dc2626;">Worst Performers</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${summary.worstPerformers.map((p, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:8px 16px;color:#0f172a;font-size:14px;font-weight:500;">${p.symbol}</td>
          <td style="padding:8px 16px;color:#dc2626;font-size:14px;font-weight:500;text-align:right;">${p.changePercent.toFixed(2)}%</td>
        </tr>`).join('')}
      </table>` : ''}
    </div>`;
  },

  renderAIHighlights(highlights: DigestContent['aiHighlights']): string {
    if (highlights.length === 0) return '';
    return `<div style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">AI Analysis Highlights</h2>
      ${highlights.map(h => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:8px;">
        <tr>
          <td style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:16px;font-weight:600;color:#0f172a;">${h.symbol}</span>
              <span style="padding:4px 12px;background-color:${h.recommendation === 'BUY' ? '#dcfce7' : h.recommendation === 'SELL' ? '#fee2e2' : '#fef9c3'};color:${h.recommendation === 'BUY' ? '#16a34a' : h.recommendation === 'SELL' ? '#dc2626' : '#ca8a04'};border-radius:12px;font-size:12px;font-weight:600;">${h.recommendation}</span>
            </div>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">${h.summary}</p>
            <span style="color:#94a3b8;font-size:12px;">Confidence: ${(h.confidence * 100).toFixed(0)}%</span>
          </td>
        </tr>
      </table>`).join('')}
    </div>`;
  },

  renderSentimentSummary(sentiments: DigestContent['sentimentSummary']): string {
    if (sentiments.length === 0) return '';
    return `<div style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Sentiment Summary</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        ${sentiments.map((s, i) => `
        <tr style="background-color:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding:10px 16px;color:#0f172a;font-size:14px;font-weight:500;">${s.symbol}</td>
          <td style="padding:10px 16px;color:${s.score >= 0.3 ? '#16a34a' : s.score <= -0.3 ? '#dc2626' : '#ca8a04'};font-size:14px;font-weight:500;text-align:right;text-transform:uppercase;">${s.sentiment}</td>
          <td style="padding:10px 16px;color:#64748b;font-size:14px;text-align:right;">${(s.score * 100).toFixed(0)}%</td>
        </tr>`).join('')}
      </table>
    </div>`;
  },

  renderRecommendations(recommendations: DigestContent['recommendations']): string {
    if (recommendations.length === 0) return '';
    return `<div style="margin-bottom:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Recommendations</h2>
      ${recommendations.map(r => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:8px;">
        <tr>
          <td style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:14px;font-weight:600;color:#0f172a;">${r.symbol}</span>
              <span style="padding:4px 12px;background-color:${r.action === 'BUY' ? '#dcfce7' : r.action === 'SELL' ? '#fee2e2' : '#fef9c3'};color:${r.action === 'BUY' ? '#16a34a' : r.action === 'SELL' ? '#dc2626' : '#ca8a04'};border-radius:12px;font-size:12px;font-weight:600;">${r.action}</span>
            </div>
            <p style="margin:0;color:#64748b;font-size:13px;">${r.reason}</p>
          </td>
        </tr>
      </table>`).join('')}
    </div>`;
  },
};
