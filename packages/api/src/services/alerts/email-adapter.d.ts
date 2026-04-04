import type { DeliveryAdapter, DeliveryAttempt } from './fanout.js';
export interface EmailAdapterConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}
export declare class EmailDeliveryAdapter implements DeliveryAdapter {
    private transporter;
    private from;
    constructor(config: EmailAdapterConfig);
    send(attempt: DeliveryAttempt): Promise<void>;
    private buildEmail;
}
export declare function buildEmailConfig(): EmailAdapterConfig | null;
