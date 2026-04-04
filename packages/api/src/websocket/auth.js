import { verifyAccessToken } from '../auth/utils.js';
export function authenticateWsClient(token) {
    try {
        const payload = verifyAccessToken(token);
        return {
            id: crypto.randomUUID(),
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            channels: new Set(),
            connectedAt: Date.now(),
            lastPingAt: Date.now()
        };
    }
    catch {
        return null;
    }
}
