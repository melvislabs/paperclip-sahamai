import type { CreateAlertInput, UpdateAlertInput, PriceAlert as PriceAlertType } from './types.js';
export declare class AlertManager {
    create(input: CreateAlertInput): Promise<PriceAlertType>;
    getById(id: string, userId: string): Promise<PriceAlertType | null>;
    listByUser(userId: string): Promise<PriceAlertType[]>;
    update(id: string, userId: string, input: UpdateAlertInput): Promise<PriceAlertType>;
    delete(id: string, userId: string): Promise<void>;
    getActiveAlertsForSymbol(symbol: string): Promise<PriceAlertType[]>;
    markTriggered(id: string, triggeredAt?: Date): Promise<PriceAlertType>;
    getHistory(userId: string): Promise<PriceAlertType[]>;
    deactivateExpired(): Promise<number>;
}
