function formatPrice(price) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'IDR' });
}
function formatCondition(condition, targetPrice) {
    switch (condition) {
        case 'ABOVE':
            return `rises above ${formatPrice(targetPrice)}`;
        case 'BELOW':
            return `drops below ${formatPrice(targetPrice)}`;
        case 'PERCENT_CHANGE':
            return `changes by ${targetPrice >= 0 ? '+' : ''}${targetPrice.toFixed(1)}%`;
        default:
            return `reaches threshold ${formatPrice(targetPrice)}`;
    }
}
export const alertTemplates = {
    format(trigger) {
        const conditionText = formatCondition(trigger.condition, trigger.targetPrice);
        const subject = `Price Alert: ${trigger.symbol} ${conditionText}`;
        const body = `Your price alert for ${trigger.symbol} has been triggered.\n\nCondition: ${conditionText}\nCurrent Price: ${formatPrice(trigger.currentPrice)}\nTriggered At: ${trigger.triggeredAt.toISOString()}`;
        const htmlBody = this.htmlTemplate(trigger, conditionText);
        return { subject, body, htmlBody };
    },
    htmlTemplate(trigger, conditionText) {
        const priceChange = trigger.previousPrice
            ? (((trigger.currentPrice - trigger.previousPrice) / trigger.previousPrice) * 100).toFixed(2)
            : null;
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Alert - ${trigger.symbol}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:600;">Saham AI</h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Price Alert Triggered</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:24px;color:#0f172a;">${trigger.symbol}</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
                <tr style="background-color:#f8fafc;">
                  <td style="padding:12px 16px;color:#64748b;font-size:14px;">Condition</td>
                  <td style="padding:12px 16px;color:#0f172a;font-size:14px;font-weight:500;text-align:right;">${conditionText}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#64748b;font-size:14px;">Current Price</td>
                  <td style="padding:12px 16px;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${formatPrice(trigger.currentPrice)}</td>
                </tr>
                ${priceChange ? `<tr style="background-color:#f8fafc;">
                  <td style="padding:12px 16px;color:#64748b;font-size:14px;">Change</td>
                  <td style="padding:12px 16px;color:${Number(priceChange) >= 0 ? '#16a34a' : '#dc2626'};font-size:14px;font-weight:500;text-align:right;">${Number(priceChange) >= 0 ? '+' : ''}${priceChange}%</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 16px;color:#64748b;font-size:14px;">Triggered At</td>
                  <td style="padding:12px 16px;color:#0f172a;font-size:14px;text-align:right;">${trigger.triggeredAt.toLocaleString()}</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.APP_URL || 'https://sahamai.app'}/stocks/${trigger.symbol}" style="display:inline-block;padding:12px 32px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">View ${trigger.symbol} Analysis</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f8fafc;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">You received this alert from Saham AI. Manage your alerts at <a href="${process.env.APP_URL || 'https://sahamai.app'}/alerts" style="color:#3b82f6;text-decoration:none;">${process.env.APP_URL || 'https://sahamai.app'}/alerts</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    },
};
