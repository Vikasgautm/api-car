import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config';
import { OtpDeliveryChannel } from '../../models/deletion-request.model';

export interface SendOtpEmailResult {
  channel: OtpDeliveryChannel;
  sent_to: string;
  // When SMTP credentials are missing we log the OTP server-side and surface a
  // sanitized indicator (without leaking the actual code) so admins know the
  // dev fallback was used.
  fallback_used: boolean;
}

export class EmailService {
  // Lazy-built transporter so unit tests / dev environments without SMTP creds
  // never construct a half-configured client.
  private static transporter: Transporter | null = null;

  static isConfigured(): boolean {
    return Boolean(config.email.smtp_host && config.email.smtp_user && config.email.smtp_pass);
  }

  private static getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp_host,
      port: config.email.smtp_port,
      secure: config.email.smtp_secure,
      auth: { user: config.email.smtp_user, pass: config.email.smtp_pass },
    });
    return this.transporter;
  }

  /**
   * Send a delete-approval OTP via email. Mirrors WhatsAppService.sendOtp's
   * contract so DeletionWorkflowService can swap channels without churn.
   *
   * - When SMTP credentials are present, sends a plain-text + HTML email
   *   containing the 6-digit OTP and a short summary of what's being approved.
   * - When not configured, falls back to logging the OTP to the server console
   *   (development only). Production throws so admins know the OTP didn't ship.
   */
  static async sendOtp(
    recipient: string,
    otp: string,
    ctx?: { request_id?: string; reason?: string; action?: string; entity_label?: string }
  ): Promise<SendOtpEmailResult> {
    if (!this.isConfigured()) {
      if (config.env === 'production') {
        throw new Error('SMTP credentials missing in production — refusing to use console fallback');
      }
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[EmailService] DEV FALLBACK — SMTP credentials are not set.`);
      console.warn(`  request_id : ${ctx?.request_id ?? '(unknown)'}`);
      console.warn(`  recipient  : ${recipient}`);
      console.warn(`  otp        : ${otp}`);
      console.warn(`  action     : ${ctx?.action ?? '-'}`);
      console.warn(`  target     : ${ctx?.entity_label ?? '-'}`);
      console.warn(`  reason     : ${ctx?.reason ?? '-'}`);
      console.warn('  Use this OTP to verify the deletion request in the admin UI.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { channel: 'console', sent_to: recipient || 'console', fallback_used: true };
    }

    const subject = `CarSalahakar deletion OTP: ${otp}`;
    const ttlMinutes = Math.round(config.deletion_workflow.otp_ttl_seconds / 60);
    const lines = [
      `Someone (you?) requested a ${ctx?.action ?? 'destructive'} action in the CarSalahakar admin panel.`,
      ``,
      `Target: ${ctx?.entity_label ?? '(unspecified)'}`,
      `Reason: ${ctx?.reason ?? '(none provided)'}`,
      `Request ID: ${ctx?.request_id ?? '(unknown)'}`,
      ``,
      `OTP: ${otp}`,
      ``,
      `This code expires in ${ttlMinutes} minute(s). If you didn't initiate this, ignore the email — the request will time out on its own.`,
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CarSalahakar - Approval Required</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">CarSalahakar</h1>
                    <p style="margin:8px 0 0;color:#ffffff;font-size:14px;opacity:0.9;">Approval Required</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 24px;color:#333333;font-size:16px;line-height:1.6;">
                      A <strong>${escapeHtml(ctx?.action ?? 'destructive')}</strong> action was requested in the admin panel.
                    </p>
                    
                    <!-- Details Table -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;background-color:#f8f9fa;border-radius:8px;overflow:hidden;">
                      <tr>
                        <td style="padding:16px 24px;border-bottom:1px solid #e9ecef;">
                          <div style="color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Target</div>
                          <div style="color:#212529;font-size:15px;font-weight:500;">${escapeHtml(ctx?.entity_label ?? '(unspecified)')}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;border-bottom:1px solid #e9ecef;">
                          <div style="color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Reason</div>
                          <div style="color:#212529;font-size:15px;font-weight:500;">${escapeHtml(ctx?.reason ?? '(none provided)')}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;">
                          <div style="color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Request ID</div>
                          <div style="color:#212529;font-size:15px;font-weight:500;font-family:monospace;">${escapeHtml(ctx?.request_id ?? '(unknown)')}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- OTP Section -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
                      <tr>
                        <td align="center" style="padding:24px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;">
                          <div style="color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;opacity:0.9;">Your Verification Code</div>
                          <div style="color:#ffffff;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;line-height:1;">${escapeHtml(otp)}</div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Warning -->
                    <p style="margin:24px 0 0;color:#6c757d;font-size:13px;line-height:1.6;">
                      ⚠️ This code expires in <strong>${ttlMinutes} minute(s)</strong>. If you didn't initiate this request, please ignore this email — it will expire automatically.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef;">
                    <p style="margin:0;color:#6c757d;font-size:12px;line-height:1.6;">
                      This is an automated message from CarSalahakar.<br>
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.getTransporter().sendMail({
      from: config.email.from,
      to: recipient,
      subject,
      text: lines.join('\n'),
      html,
    });

    return { channel: 'email', sent_to: recipient, fallback_used: false };
  }

  static async sendInviteEmail(
    recipient: string,
    userName: string,
    resetUrl: string
  ): Promise<SendOtpEmailResult> {
    if (!this.isConfigured()) {
      if (config.env === 'production') {
        throw new Error('SMTP credentials missing in production');
      }
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[EmailService] DEV FALLBACK — SMTP credentials are not set.`);
      console.warn(`  recipient  : ${recipient}`);
      console.warn(`  user_name  : ${userName}`);
      console.warn(`  reset_url  : ${resetUrl}`);
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { channel: 'console', sent_to: recipient || 'console', fallback_used: true };
    }

    const subject = `Welcome to CarSalahakar - Set Your Password`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CarSalahakar - Welcome</title>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">CarSalahakar</h1>
                    <p style="margin:8px 0 0;color:#ffffff;font-size:14px;opacity:0.9;">Welcome to the Admin Panel</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 24px;color:#333333;font-size:16px;line-height:1.6;">
                      Hello <strong>${escapeHtml(userName)}</strong>,
                    </p>

                    <p style="margin:0 0 24px;color:#333333;font-size:16px;line-height:1.6;">
                      You've been invited to join CarSalahakar. Click the button below to set your password and get started.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                            Set Your Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;color:#6c757d;font-size:13px;line-height:1.6;">
                      This link expires in <strong>7 days</strong>. If you didn't expect this invite, please contact your administrator.
                    </p>

                    <p style="margin:16px 0 0;color:#6c757d;font-size:13px;line-height:1.6;">
                      Or paste this link in your browser:<br>
                      <code style="word-break:break-all;background:#f8f9fa;padding:8px 12px;border-radius:4px;display:block;margin-top:8px;font-size:12px;">${escapeHtml(resetUrl)}</code>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef;">
                    <p style="margin:0;color:#6c757d;font-size:12px;line-height:1.6;">
                      This is an automated message from CarSalahakar.<br>
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.getTransporter().sendMail({
      from: config.email.from,
      to: recipient,
      subject,
      html,
    });

    return { channel: 'email', sent_to: recipient, fallback_used: false };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
