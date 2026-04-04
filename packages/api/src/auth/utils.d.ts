import type { TokenPayload, RefreshTokenPayload, AuthUser, UserRole } from './types.js';
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateAccessToken(user: AuthUser): string;
export declare function generateRefreshToken(userId: string): {
    token: string;
    jti: string;
};
export declare function verifyAccessToken(token: string): TokenPayload;
export declare function verifyRefreshToken(token: string): RefreshTokenPayload;
export declare function hasRole(userRole: UserRole, requiredRole: UserRole): boolean;
export declare function generateApiKey(): {
    rawKey: string;
    keyHash: string;
};
