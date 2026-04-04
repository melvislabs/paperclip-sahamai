import prisma from '@sahamai/api/src/db/index';
import { AlertMonitor } from '@sahamai/api/src/services/alerts/monitor';
import { Notifier } from '@sahamai/api/src/services/alerts/notifier';
import type { StockApiClient } from '@sahamai/shared';
import type { Transporter } from 'nodemailer';
import type { NotificationChannel } from '@sahamai/api/src/services/alerts/types';

export interface PriceAlertMonitorResult {
  symbol: string;
  alertsChecked: number;
  alertsTriggered: number;
  notificationsSent: number;
  errors: string[];
}

export interface PriceAlertMonitorJobOptions {
  symbols?: string[];
  emailTransporter?: Transporter;
  emailFrom?: string;
}

export class PriceAlertMonitorJob {
  private monitor: AlertMonitor;
  private notifier: Notifier;
  private client: StockApiClient;
  private options: PriceAlertMonitorJobOptions;

  constructor(client: StockApiClient, options: PriceAlertMonitorJobOptions = {}) {
    this.client = client;
    this.options = options;
    this.monitor = new AlertMonitor();
    this.notifier = new Notifier({
      sendInApp: this.sendInApp.bind(this),
      sendEmail: this.sendEmail.bind(this),
      getUserEmail: this.getUserEmail.bind(this),
    });
  }

  async execute(): Promise<PriceAlertMonitorResult[]> {
    const symbols = this.options.symbols ?? await this.getSymbolsWithActiveAlerts();
    const results: PriceAlertMonitorResult[] = [];

    for (const symbol of symbols) {
      const result = await this.processSymbol(symbol.toUpperCase());
      results.push(result);
    }

    await this.deactivateExpiredAlerts();
    return results;
  }

  private async processSymbol(symbol: string): Promise<PriceAlertMonitorResult> {
    const result: PriceAlertMonitorResult = {
      symbol,
      alertsChecked: 0,
      alertsTriggered: 0,
      notificationsSent: 0,
      errors: [],
    };

    try {
      const quoteResponse = await this.client.getQuote(symbol);
      if (!quoteResponse.success) {
        result.errors.push(`Failed to fetch quote for ${symbol}`);
        return result;
      }

      const currentPrice = quoteResponse.data.price;
      const alerts = await prisma.priceAlert.findMany({
        where: {
          stock: { symbol },
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: { stock: true },
      });

      result.alertsChecked = alerts.length;

      for (const alert of alerts) {
        const domainAlert = {
          id: alert.id,
          userId: alert.userId,
          symbol: alert.stock.symbol,
          condition: alert.condition,
          targetPrice: Number(alert.targetPrice),
          isActive: alert.isActive,
          alertType: alert.alertType,
          expiresAt: alert.expiresAt,
          triggeredAt: alert.triggeredAt,
           notificationChannels: (alert.notificationChannels ?? ['in_app']) as NotificationChannel[],
          cooldownUntil: alert.cooldownUntil,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt,
        };

        const trigger = this.monitor.evaluate(domainAlert, currentPrice);

        if (trigger) {
          result.alertsTriggered++;
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
              triggeredAt: trigger.triggeredAt,
              cooldownUntil: new Date(trigger.triggeredAt.getTime() + 60 * 60 * 1000),
            },
          });

          await this.notifier.notify(trigger, domainAlert.notificationChannels);
          result.notificationsSent += domainAlert.notificationChannels.length;
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  private async getSymbolsWithActiveAlerts(): Promise<string[]> {
    const alerts = await prisma.priceAlert.findMany({
      where: { isActive: true },
      include: { stock: true },
    });
    return [...new Set(alerts.map((a) => a.stock.symbol))];
  }

  private async deactivateExpiredAlerts(): Promise<void> {
    await prisma.priceAlert.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    });
  }

  private async sendInApp(userId: string, subject: string, body: string): Promise<void> {
    console.log(`[In-App] Notification for user ${userId}: ${subject}`);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (this.options.emailTransporter) {
      await this.options.emailTransporter.sendMail({
        from: this.options.emailFrom || 'alerts@sahamai.app',
        to,
        subject,
        html,
      });
    } else {
      console.log(`[Email] Would send to ${to}: ${subject}`);
    }
  }

  private async getUserEmail(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }
}
