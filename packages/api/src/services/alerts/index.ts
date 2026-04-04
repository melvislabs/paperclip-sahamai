export { AlertManager } from './manager.js';
export { AlertMonitor } from './monitor.js';
export { Notifier } from './notifier.js';
export { alertTemplates } from './templates.js';
export { EmailDeliveryAdapter, buildEmailConfig } from './email-adapter.js';
export type {
  PriceAlert,
  CreateAlertInput,
  UpdateAlertInput,
  AlertTrigger,
  AlertCondition,
  NotificationChannel,
  AlertType,
} from './types.js';
export { MAX_ACTIVE_ALERTS_PER_USER, MAX_NOTIFICATIONS_PER_HOUR, ALERT_COOLDOWN_MS } from './types.js';
