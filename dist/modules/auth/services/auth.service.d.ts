import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
export declare class AuthService {
    static register(registerDto: RegisterDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    static login(loginDto: LoginDto, req?: any): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    static refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    static logout(user_id: string): Promise<{
        message: string;
    }>;
    static getProfile(user_id: string): Promise<any>;
    private static generateTokens;
    private static saveRefreshToken;
    private static parseExpiresIn;
    private static sanitizeUser;
    private static extractDeviceInfo;
    private static extractIpAddress;
}
//# sourceMappingURL=auth.service.d.ts.map