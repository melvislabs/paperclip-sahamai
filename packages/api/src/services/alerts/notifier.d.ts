import type { AlertTrigger } from './types.js';
export interface NotifierOptions {
    sendInApp: (userId: string, subject: string, body: string) => Promise<void>;
    sendEmail: (to: string, subject: string, html: string) => Promise<void>;
    getUserEmail: (userId: string) => Promise<string | null>;
}
export declare class Notifier {
    private opts;
    constructor(opts: NotifierOptions);
    notify(trigger: AlertTrigger, channels: string[]): Promise<void>;
    private sendEmailNotification;
}
