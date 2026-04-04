import type { WsClient } from './types.js';
export declare class ChannelManager {
    private channels;
    subscribe(client: WsClient, channel: string): boolean;
    unsubscribe(client: WsClient, channel: string): boolean;
    unsubscribeAll(client: WsClient): void;
    getClientsForChannel(channel: string): Set<string>;
    getSubscribedChannels(client: WsClient): string[];
    private isValidChannelForClient;
}
