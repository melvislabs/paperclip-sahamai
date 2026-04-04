import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
}
export async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}
export function generateRefreshToken(userId) {
    const jti = randomUUID();
    const payload = { userId, jti };
    const token = jwt.sign(payload, getSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { token, jti };
}
export function verifyAccessToken(token) {
    return jwt.verify(token, getSecret());
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, getSecret());
}
export function hasRole(userRole, requiredRole) {
    const roleHierarchy = {
        service: 1,
        user: 2,
        admin: 3,
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
export function generateApiKey() {
    const rawKey = `sk_${randomUUID().replace(/-/g, '')}`;
    const keyHash = bcrypt.hashSync(rawKey, BCRYPT_ROUNDS);
    return { rawKey, keyHash };
}
