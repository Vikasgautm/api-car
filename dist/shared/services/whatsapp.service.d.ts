import { OtpDeliveryChannel } from '../../models/deletion-request.model';
export interface SendOtpResult {
    channel: OtpDeliveryChannel;
    sent_to: string;
    fallback_used: boolean;
}
export declare class WhatsAppService {
    static isConfigured(): boolean;
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
    static sendOtp(phone: string, otp: string, ctx?: {
        request_id?: string;
        reason?: string;
    }): Promise<SendOtpResult>;
}
//# sourceMappingURL=whatsapp.service.d.ts.map