import { OtpDeliveryChannel } from '../../models/deletion-request.model';
export interface SendOtpEmailResult {
    channel: OtpDeliveryChannel;
    sent_to: string;
    fallback_used: boolean;
}
export declare class EmailService {
    private static transporter;
    static isConfigured(): boolean;
    private static getTransporter;
    /**
     * Send a delete-approval OTP via email.
     *
     * - When SMTP credentials are present, sends a plain-text + HTML email
     *   containing the 6-digit OTP and a short summary of what's being approved.
     * - When not configured, falls back to logging the OTP to the server console
     *   (development only). Production throws so admins know the OTP didn't ship.
     */
    static sendOtp(recipient: string, otp: string, ctx?: {
        request_id?: string;
        reason?: string;
        action?: string;
        entity_label?: string;
    }): Promise<SendOtpEmailResult>;
    /**
     * Send a lifecycle-approval OTP via email.
     * Separate from sendOtp so messaging is lifecycle-specific.
     */
    static sendLifecycleOtp(recipient: string, otp: string, ctx?: {
        request_id?: string;
        from_state?: string;
        to_state?: string;
        entity_label?: string;
        reason?: string;
        is_override?: boolean;
    }): Promise<SendOtpEmailResult>;
    static sendInviteEmail(recipient: string, userName: string, resetUrl: string): Promise<SendOtpEmailResult>;
}
//# sourceMappingURL=email.service.d.ts.map