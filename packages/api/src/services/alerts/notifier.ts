import type { AlertTrigger } from './types.js';
import { alertTemplates } from './templates.js';

export interface NotifierOptions {
  sendInApp: (userId: string, subject: string, body: string) => Promise<void>;
  sendEmail: (to: string, subject: string, html: string) => Promise<void>;
  getUserEmail: (userId: string) => Promise<string | null>;
}

export class Notifier {
  private opts: NotifierOptions;

  constructor(opts: NotifierOptions) {
    this.opts = opts;
  }

  async notify(trigger: AlertTrigger, channels: string[]): Promise<void> {
    const { subject, body, htmlBody } = alertTemplates.format(trigger);

    const promises: Promise<void>[] = [];

    if (channels.includes('in_app')) {
      promises.push(
        this.opts.sendInApp(trigger.userId, subject, body).catch((err) => {
          console.error(`Failed to send in-app notification for alert ${trigger.alertId}:`, err);
        }),
      );
    }

    if (channels.includes('email')) {
      promises.push(this.sendEmailNotification(trigger, subject, htmlBody));
    }

    if (channels.includes('push')) {
      console.log(`Push notification queued for alert ${trigger.alertId} (not yet implemented)`);
    }

    await Promise.allSettled(promises);
  }

  private async sendEmailNotification(
    trigger: AlertTrigger,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    const email = await this.opts.getUserEmail(trigger.userId);
    if (!email) {
      console.warn(`No email found for user ${trigger.userId}, skipping email notification`);
      return;
    }
    await this.opts.sendEmail(email, subject, htmlBody);
  }
}
