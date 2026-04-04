export type UserRole = 'admin' | 'user' | 'service';
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
}
export interface RegisterRequest {
    email: string;
    password: string;
    role?: UserRole;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
    token: string;
    refreshToken: string;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface RefreshTokenPayload {
    userId: string;
    jti: string;
}
export interface ApiKeyRecord {
    id: string;
    keyHash: string;
    userId: string;
    name: string;
    role: UserRole;
    createdAt: string;
    expiresAt?: string;
}
export interface CreateApiKeyRequest {
    name: string;
    role?: UserRole;
    expiresAt?: string;
}
export interface CreateApiKeyResponse {
    apiKey: ApiKeyRecord;
    rawKey: string;
}
