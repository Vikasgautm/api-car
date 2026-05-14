"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
class WhatsAppService {
    static isConfigured() {
        return Boolean(config_1.config.whatsapp.phone_number_id && config_1.config.whatsapp.access_token);
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
    static async sendOtp(phone, otp, ctx) {
        if (!this.isConfigured()) {
            if (config_1.config.env === 'production') {
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
        const url = `https://graph.facebook.com/${config_1.config.whatsapp.api_version}/${config_1.config.whatsapp.phone_number_id}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            to: phone.replace(/[^\d+]/g, ''),
            type: 'template',
            template: {
                name: config_1.config.whatsapp.otp_template_name,
                language: { code: config_1.config.whatsapp.otp_template_language },
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
        await axios_1.default.post(url, payload, {
            headers: {
                Authorization: `Bearer ${config_1.config.whatsapp.access_token}`,
                'Content-Type': 'application/json',
            },
            timeout: 10_000,
        });
        return { channel: 'whatsapp', sent_to: phone, fallback_used: false };
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=whatsapp.service.js.map