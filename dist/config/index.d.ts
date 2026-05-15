export declare const config: {
    port: string | number;
    mongodb_uri: string;
    jwt_secret: string;
    jwt_refresh_secret: string;
    jwt_expires_in: string;
    jwt_refresh_expires_in: string;
    env: string;
    cors_origin: string;
    cloudinary_cloud_name: string | undefined;
    cloudinary_api_key: string | undefined;
    cloudinary_api_secret: string | undefined;
    super_admin: {
        email: string;
        password: string;
        name: string;
        phone: string;
    };
    cookie: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "strict";
        maxAge: number;
    };
    whatsapp: {
        phone_number_id: string;
        access_token: string;
        otp_template_name: string;
        otp_template_language: string;
        api_version: string;
    };
    email: {
        smtp_host: string;
        smtp_port: number;
        smtp_secure: boolean;
        smtp_user: string;
        smtp_pass: string;
        from: string;
    };
    deletion_workflow: {
        otp_ttl_seconds: number;
        otp_max_attempts: number;
        otp_email_recipient: string;
    };
};
//# sourceMappingURL=index.d.ts.map