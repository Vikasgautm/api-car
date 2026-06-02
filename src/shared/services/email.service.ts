import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config';
import { OtpDeliveryChannel } from '../../models/deletion-request.model';
import { AppError } from '../utils/app-error.util';

// Admin-facing message for SMTP misconfiguration; technical detail stays in logs.
const EMAIL_NOT_CONFIGURED_MSG =
  'Email service is not configured properly. Please contact the administrator.';

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
   * Send a delete-approval OTP via email.
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
      // SMTP not configured — log OTP to server console so admin can retrieve it.
      // This works in all environments; configure SMTP_HOST/SMTP_USER/SMTP_PASS to
      // enable real email delivery.
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[EmailService] SMTP NOT CONFIGURED — OTP logged to console.`);
      console.warn(`  request_id : ${ctx?.request_id ?? '(unknown)'}`);
      console.warn(`  recipient  : ${recipient}`);
      console.warn(`  OTP        : ${otp}`);
      console.warn(`  action     : ${ctx?.action ?? '-'}`);
      console.warn(`  target     : ${ctx?.entity_label ?? '-'}`);
      console.warn(`  reason     : ${ctx?.reason ?? '-'}`);
      console.warn('  → Use this OTP in the admin UI to approve the request.');
      console.warn('  → Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars for email delivery.');
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

  /**
   * Send a lifecycle-approval OTP via email.
   * Separate from sendOtp so messaging is lifecycle-specific.
   */
  static async sendLifecycleOtp(
    recipient: string,
    otp: string,
    ctx?: {
      request_id?: string;
      from_state?: string;
      to_state?: string;
      entity_label?: string;
      reason?: string;
      is_override?: boolean;
    }
  ): Promise<SendOtpEmailResult> {
    if (!this.isConfigured()) {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[EmailService] SMTP NOT CONFIGURED — LIFECYCLE OTP logged to console.`);
      console.warn(`  request_id : ${ctx?.request_id ?? '(unknown)'}`);
      console.warn(`  recipient  : ${recipient}`);
      console.warn(`  OTP        : ${otp}`);
      console.warn(`  transition : ${ctx?.from_state ?? '?'} → ${ctx?.to_state ?? '?'}`);
      console.warn(`  target     : ${ctx?.entity_label ?? '-'}`);
      console.warn(`  reason     : ${ctx?.reason ?? '-'}`);
      console.warn(`  override   : ${ctx?.is_override ? 'YES — HISTORICAL RELAUNCH' : 'no'}`);
      console.warn('  → Use this OTP in the admin UI to approve the lifecycle transition.');
      console.warn('  → Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars for email delivery.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { channel: 'console', sent_to: recipient || 'console', fallback_used: true };
    }

    const transition = `${ctx?.from_state ?? '?'} → ${ctx?.to_state ?? '?'}`;
    const subject = `CarSalahakar LIFECYCLE OTP [${transition}]: ${otp}`;
    const ttlMinutes = Math.round(config.lifecycle_governance.otp_ttl_seconds / 60);
    const overrideWarning = ctx?.is_override
      ? `<tr><td style="padding:16px 24px;border-bottom:1px solid #e9ecef;background:#fff3cd;">
           <div style="color:#856404;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">⚠ OVERRIDE REQUEST</div>
           <div style="color:#856404;font-size:14px;font-weight:500;">This is a BLOCKED TRANSITION override (historical relaunch). Verify carefully before approving.</div>
         </td></tr>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#dc3545 0%,#a71d2a 100%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">CarSalahakar</h1>
                    <p style="margin:8px 0 0;color:#ffffff;font-size:13px;opacity:0.9;">Lifecycle Governance — OTP Required</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 40px 0;">
                    <p style="margin:0 0 20px;color:#333;font-size:15px;line-height:1.6;">
                      A <strong>lifecycle transition</strong> requires your verification.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:#f8f9fa;border-radius:8px;overflow:hidden;border:1px solid #dee2e6;">
                      ${overrideWarning}
                      <tr>
                        <td style="padding:14px 24px;border-bottom:1px solid #e9ecef;">
                          <div style="color:#6c757d;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Car</div>
                          <div style="color:#212529;font-size:14px;font-weight:500;">${escapeHtml(ctx?.entity_label ?? '(unspecified)')}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 24px;border-bottom:1px solid #e9ecef;">
                          <div style="color:#6c757d;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Transition</div>
                          <div style="color:#dc3545;font-size:15px;font-weight:700;">${escapeHtml(transition)}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 24px;border-bottom:1px solid #e9ecef;">
                          <div style="color:#6c757d;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Reason</div>
                          <div style="color:#212529;font-size:14px;">${escapeHtml(ctx?.reason ?? '(none provided)')}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 24px;">
                          <div style="color:#6c757d;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Request ID</div>
                          <div style="color:#212529;font-size:13px;font-family:monospace;">${escapeHtml(ctx?.request_id ?? '(unknown)')}</div>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
                      <tr>
                        <td align="center" style="padding:20px;background:linear-gradient(135deg,#dc3545 0%,#a71d2a 100%);border-radius:10px;">
                          <div style="color:#ffffff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;opacity:0.9;">Verification Code</div>
                          <div style="color:#ffffff;font-size:34px;font-weight:700;letter-spacing:8px;font-family:monospace;">${escapeHtml(otp)}</div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 32px;color:#6c757d;font-size:12px;line-height:1.6;">
                      Expires in <strong>${ttlMinutes} minute(s)</strong>. If you didn't initiate this, the request will expire automatically.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e9ecef;">
                    <p style="margin:0;color:#6c757d;font-size:11px;">CarSalahakar — Automated lifecycle governance email. Do not reply.</p>
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

  static async sendInviteEmail(
    recipient: string,
    userName: string,
    resetUrl: string
  ): Promise<SendOtpEmailResult> {
    if (!this.isConfigured()) {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[EmailService] SMTP NOT CONFIGURED — invite email logged to console.`);
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
