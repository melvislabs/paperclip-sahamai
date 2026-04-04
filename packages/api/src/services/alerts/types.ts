export type AlertCondition = 'ABOVE' | 'BELOW' | 'PERCENT_CHANGE';
export type NotificationChannel = 'in_app' | 'email' | 'push';
export type AlertType = 'ONE_TIME' | 'RECURRING' | 'EXPIRING';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  isActive: boolean;
  alertType: AlertType;
  expiresAt: Date | null;
  triggeredAt: Date | null;
  notificationChannels: NotificationChannel[];
  cooldownUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlertInput {
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  alertType?: AlertType;
  expiresAt?: Date;
  notificationChannels?: NotificationChannel[];
}

export interface UpdateAlertInput {
  targetPrice?: number;
  isActive?: boolean;
  notificationChannels?: NotificationChannel[];
  expiresAt?: Date;
}

export interface AlertTrigger {
  alertId: string;
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  previousPrice?: number;
  triggeredAt: Date;
}

export const MAX_ACTIVE_ALERTS_PER_USER = 50;
export const MAX_NOTIFICATIONS_PER_HOUR = 10;
export const ALERT_COOLDOWN_MS = 60 * 60 * 1000;
