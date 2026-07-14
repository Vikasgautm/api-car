export declare class AuthService {
    static register(registerDto: any): Promise<{
        user: any;
    }>;
    static login(loginDto: any, req?: any): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    static refreshToken(refreshTokenDto: any): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    static logout(user_id: string): Promise<{
        message: string;
    }>;
    static getProfile(user_id: string): Promise<any>;
    static resetPassword(token: string, user_id: string, password: string): Promise<{
        message: string;
    }>;
    private static generateTokens;
    private static saveRefreshToken;
    private static parseExpiresIn;
    private static parseJsonFields;
    private static sanitizeUser;
    private static extractDeviceInfo;
    private static extractIpAddress;
}
