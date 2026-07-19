export declare const config: {
    port: string | number;
    mongodb_uri: string;
    mongodb_db_name: string;
    jwt_secret: string;
    jwt_refresh_secret: string;
    jwt_expires_in: string;
    jwt_refresh_expires_in: string;
    env: string;
    cors_origin: string;
    app: {
        frontend_url: string;
    };
    aws_access_key_id: string | undefined;
    aws_secret_access_key: string | undefined;
    aws_region: string;
    aws_bucket_name: string | undefined;
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
    lifecycle_governance: {
        otp_ttl_seconds: number;
        otp_max_attempts: number;
        otp_email_recipient: string;
    };
};
