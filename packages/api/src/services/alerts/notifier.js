import { alertTemplates } from './templates.js';
export class Notifier {
    opts;
    constructor(opts) {
        this.opts = opts;
    }
    async notify(trigger, channels) {
        const { subject, body, htmlBody } = alertTemplates.format(trigger);
        const promises = [];
        if (channels.includes('in_app')) {
            promises.push(this.opts.sendInApp(trigger.userId, subject, body).catch((err) => {
                console.error(`Failed to send in-app notification for alert ${trigger.alertId}:`, err);
            }));
        }
        if (channels.includes('email')) {
            promises.push(this.sendEmailNotification(trigger, subject, htmlBody));
        }
        if (channels.includes('push')) {
            console.log(`Push notification queued for alert ${trigger.alertId} (not yet implemented)`);
        }
        await Promise.allSettled(promises);
    }
    async sendEmailNotification(trigger, subject, htmlBody) {
        const email = await this.opts.getUserEmail(trigger.userId);
        if (!email) {
            console.warn(`No email found for user ${trigger.userId}, skipping email notification`);
            return;
        }
        await this.opts.sendEmail(email, subject, htmlBody);
    }
}
