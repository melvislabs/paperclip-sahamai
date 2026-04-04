import type { AlertTrigger } from './types.js';
export declare const alertTemplates: {
    format(trigger: AlertTrigger): {
        subject: string;
        body: string;
        htmlBody: string;
    };
    htmlTemplate(trigger: AlertTrigger, conditionText: string): string;
};
