import { getPrismaClient } from '../../db/index.js';
import type { CreateAlertInput, UpdateAlertInput, PriceAlert as PriceAlertType } from './types.js';
import { MAX_ACTIVE_ALERTS_PER_USER } from './types.js';

function toDomain(alert: any): PriceAlertType {
  return {
    id: alert.id,
    userId: alert.userId,
    symbol: alert.stock?.symbol ?? alert.symbol ?? '',
    condition: alert.condition,
    targetPrice: Number(alert.targetPrice),
    isActive: alert.isActive,
    alertType: alert.alertType,
    expiresAt: alert.expiresAt,
    triggeredAt: alert.triggeredAt,
    notificationChannels: alert.notificationChannels ?? ['in_app'],
    cooldownUntil: alert.cooldownUntil,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}

async function getStockId(symbol: string): Promise<string> {
  const stock = await getPrismaClient().stock.findUnique({ where: { symbol: symbol.toUpperCase() } });
  if (!stock) {
    throw new Error(`Stock ${symbol} not found`);
  }
  return stock.id;
}

export class AlertManager {
  async create(input: CreateAlertInput): Promise<PriceAlertType> {
    const activeCount = await getPrismaClient().priceAlert.count({
      where: { userId: input.userId, isActive: true },
    });

    if (activeCount >= MAX_ACTIVE_ALERTS_PER_USER) {
      throw new Error(`Maximum ${MAX_ACTIVE_ALERTS_PER_USER} active alerts per user`);
    }

    const stockId = await getStockId(input.symbol);

    const alert = await getPrismaClient().priceAlert.create({
      data: {
        userId: input.userId,
        stockId,
        condition: input.condition,
        targetPrice: input.targetPrice,
        isActive: true,
        notificationChannels: input.notificationChannels ?? ['in_app'],
        alertType: input.alertType ?? 'ONE_TIME',
        expiresAt: input.expiresAt ?? null,
      },
      include: { stock: true },
    });

    return toDomain(alert);
  }

  async getById(id: string, userId: string): Promise<PriceAlertType | null> {
    const alert = await getPrismaClient().priceAlert.findFirst({
      where: { id, userId },
      include: { stock: true },
    });
    return alert ? toDomain(alert) : null;
  }

  async listByUser(userId: string): Promise<PriceAlertType[]> {
    const alerts = await getPrismaClient().priceAlert.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    });
    return alerts.map(toDomain);
  }

  async update(id: string, userId: string, input: UpdateAlertInput): Promise<PriceAlertType> {
    const alert = await this.getById(id, userId);
    if (!alert) throw new Error('Alert not found');

    const updated = await getPrismaClient().priceAlert.update({
      where: { id },
      data: {
        ...(input.targetPrice !== undefined && { targetPrice: input.targetPrice }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.notificationChannels && { notificationChannels: input.notificationChannels }),
        ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
      },
      include: { stock: true },
    });

    return toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const alert = await this.getById(id, userId);
    if (!alert) throw new Error('Alert not found');
    await getPrismaClient().priceAlert.delete({ where: { id } });
  }

  async getActiveAlertsForSymbol(symbol: string): Promise<PriceAlertType[]> {
    const alerts = await getPrismaClient().priceAlert.findMany({
      where: {
        stock: { symbol: symbol.toUpperCase() },
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { stock: true },
    });
    return alerts.map(toDomain);
  }

  async markTriggered(id: string, triggeredAt: Date = new Date()): Promise<PriceAlertType> {
    const alert = await getPrismaClient().priceAlert.update({
      where: { id },
      data: {
        triggeredAt,
        cooldownUntil: new Date(triggeredAt.getTime() + 60 * 60 * 1000),
      },
      include: { stock: true },
    });
    return toDomain(alert);
  }

  async getHistory(userId: string): Promise<PriceAlertType[]> {
    const alerts = await getPrismaClient().priceAlert.findMany({
      where: { userId, triggeredAt: { not: null } },
      include: { stock: true },
      orderBy: { triggeredAt: 'desc' },
    });
    return alerts.map(toDomain);
  }

  async deactivateExpired(): Promise<number> {
    const result = await getPrismaClient().priceAlert.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    });
    return result.count;
  }
}
