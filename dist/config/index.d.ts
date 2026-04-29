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
};
//# sourceMappingURL=index.d.ts.map