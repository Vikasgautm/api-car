export declare class OtpService {
    /**
     * Generate a numeric OTP of `digits` digits (default 6). Uses `crypto.randomInt`
     * for uniform distribution — Math.random is not acceptable for security tokens.
     */
    static generate(digits?: number): string;
    static hash(otp: string): Promise<string>;
    static verify(otp: string, hash: string): Promise<boolean>;
}
