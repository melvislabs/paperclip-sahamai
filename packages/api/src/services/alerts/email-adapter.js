import nodemailer from 'nodemailer';
export class EmailDeliveryAdapter {
    transporter;
    from;
    constructor(config) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass,
            },
        });
        this.from = config.from;
    }
    async send(attempt) {
        const { destination, event } = attempt;
        const signal = event.signal;
        const subject = `Saham AI Signal: ${signal.symbol} - ${signal.action.toUpperCase()}`;
        const html = this.buildEmail(signal);
        await this.transporter.sendMail({
            from: this.from,
            to: destination.recipient,
            subject,
            html,
        });
    }
    buildEmail(signal) {
        const actionColor = signal.action === 'buy' ? '#16a34a' : signal.action === 'sell' ? '#dc2626' : '#ca8a04';
        return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Saham AI Signal</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#0f172a;padding:24px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:600;">Saham AI</h1>
          <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Trading Signal Alert</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:24px;color:#0f172a;">${signal.symbol}</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
            <tr style="background-color:#f8fafc;">
              <td style="padding:12px 16px;color:#64748b;font-size:14px;">Action</td>
              <td style="padding:12px 16px;color:${actionColor};font-size:14px;font-weight:600;text-align:right;text-transform:uppercase;">${signal.action}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#64748b;font-size:14px;">Confidence</td>
              <td style="padding:12px 16px;color:#0f172a;font-size:14px;font-weight:500;text-align:right;">${(signal.confidence * 100).toFixed(0)}%</td>
            </tr>
            <tr style="background-color:#f8fafc;">
              <td style="padding:12px 16px;color:#64748b;font-size:14px;">Generated</td>
              <td style="padding:12px 16px;color:#0f172a;font-size:14px;text-align:right;">${new Date(signal.generatedAt).toLocaleString()}</td>
            </tr>
          </table>
          ${signal.reasonCodes.length > 0 ? `<div style="margin-top:16px;"><h3 style="margin:0 0 8px;font-size:14px;color:#64748b;">Reasons</h3><ul style="margin:0;padding-left:20px;color:#0f172a;font-size:14px;">${signal.reasonCodes.map((r) => `<li>${r}</li>`).join('')}</ul></div>` : ''}
        </td></tr>
        <tr><td style="padding:16px 32px;background-color:#f8fafc;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Saham AI - Automated trading signals</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }
}
export function buildEmailConfig() {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS)
        return null;
    return {
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        from: SMTP_FROM || 'alerts@sahamai.app',
    };
}
