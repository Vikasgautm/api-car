import axios from 'axios';
import { config } from '../../config';
import { OtpDeliveryChannel } from '../../models/deletion-request.model';

export interface SendOtpResult {
  channel: OtpDeliveryChannel;
  sent_to: string;
  // When WhatsApp credentials are missing we log the OTP server-side and surface
  // a sanitized indicator (without leaking the actual code) so admins know the
  // dev fallback was used.
  fallback_used: boolean;
}

export class WhatsAppService {
  static isConfigured(): boolean {
    return Boolean(config.whatsapp.phone_number_id && config.whatsapp.access_token);
  }

  /**
   * Send a delete-approval OTP. Returns the channel actually used.
   *
   * - When the WhatsApp Cloud API credentials are present, sends via the configured
   *   utility template (`otp_template_name`) with the OTP as the single body parameter.
   * - When not configured, falls back to logging the OTP to the server console with a
   *   loud banner so dev environments can still complete the workflow. This NEVER
   *   happens in production (NODE_ENV=production) — instead the call throws so the
   *   request errors loudly and the admin knows to configure credentials.
   */
  static async sendOtp(phone: string, otp: string, ctx?: { request_id?: string; reason?: string }): Promise<SendOtpResult> {
    if (!this.isConfigured()) {
      if (config.env === 'production') {
        throw new Error('WhatsApp credentials missing in production — refusing to use console fallback');
      }
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn(`[WhatsAppService] DEV FALLBACK — WhatsApp credentials are not set.`);
      console.warn(`  request_id : ${ctx?.request_id ?? '(unknown)'}`);
      console.warn(`  phone      : ${phone}`);
      console.warn(`  otp        : ${otp}`);
      console.warn(`  reason     : ${ctx?.reason ?? '-'}`);
      console.warn('  Use this OTP to verify the deletion request in the admin UI.');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { channel: 'console', sent_to: phone || 'console', fallback_used: true };
    }

    const url = `https://graph.facebook.com/${config.whatsapp.api_version}/${config.whatsapp.phone_number_id}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: phone.replace(/[^\d+]/g, ''),
      type: 'template',
      template: {
        name: config.whatsapp.otp_template_name,
        language: { code: config.whatsapp.otp_template_language },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
          // WhatsApp authentication templates also require a button component
          // when using the OTP button format. Falls back gracefully if the
          // configured template is a plain utility template (Meta ignores
          // unexpected button components for non-OTP templates).
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    };

    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.access_token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });

    return { channel: 'whatsapp', sent_to: phone, fallback_used: false };
  }
}
