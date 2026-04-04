export class AlertMonitor {
    evaluate(alert, currentPrice, previousPrice) {
        if (!alert.isActive)
            return null;
        if (alert.cooldownUntil && alert.cooldownUntil > new Date())
            return null;
        if (alert.expiresAt && alert.expiresAt < new Date())
            return null;
        if (alert.alertType === 'ONE_TIME' && alert.triggeredAt)
            return null;
        const triggered = this.checkCondition(alert.condition, Number(alert.targetPrice), currentPrice, previousPrice);
        if (!triggered)
            return null;
        return {
            alertId: alert.id,
            userId: alert.userId,
            symbol: alert.symbol,
            condition: alert.condition,
            targetPrice: Number(alert.targetPrice),
            currentPrice,
            previousPrice,
            triggeredAt: new Date(),
        };
    }
    checkCondition(condition, targetPrice, currentPrice, previousPrice) {
        switch (condition) {
            case 'ABOVE':
                return currentPrice >= targetPrice;
            case 'BELOW':
                return currentPrice <= targetPrice;
            case 'PERCENT_CHANGE': {
                if (!previousPrice || previousPrice === 0)
                    return false;
                const pctChange = ((currentPrice - previousPrice) / previousPrice) * 100;
                return pctChange >= targetPrice;
            }
            default:
                return false;
        }
    }
}
