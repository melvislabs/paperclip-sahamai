import type { PriceAlert, AlertTrigger } from './types.js';
export declare class AlertMonitor {
    evaluate(alert: PriceAlert, currentPrice: number, previousPrice?: number): AlertTrigger | null;
    private checkCondition;
}
