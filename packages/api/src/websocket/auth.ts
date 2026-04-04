import { verifyAccessToken } from '../auth/utils.js';
import type { WsClient } from './types.js';

export function authenticateWsClient(token: string): WsClient | null {
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
  } catch {
    return null;
  }
}
