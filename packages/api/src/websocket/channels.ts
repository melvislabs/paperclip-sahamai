import type { ChannelSubscription, WsClient } from './types.js';

export class ChannelManager {
  private channels: Map<string, ChannelSubscription> = new Map();

  subscribe(client: WsClient, channel: string): boolean {
    if (!this.isValidChannelForClient(client, channel)) {
      return false;
    }

    let subscription = this.channels.get(channel);
    if (!subscription) {
      subscription = { channel, clientIds: new Set() };
      this.channels.set(channel, subscription);
    }

    subscription.clientIds.add(client.id);
    client.channels.add(channel);
    return true;
  }

  unsubscribe(client: WsClient, channel: string): boolean {
    const subscription = this.channels.get(channel);
    if (!subscription) {
      return false;
    }

    subscription.clientIds.delete(client.id);
    client.channels.delete(channel);

    if (subscription.clientIds.size === 0) {
      this.channels.delete(channel);
    }

    return true;
  }

  unsubscribeAll(client: WsClient): void {
    for (const channel of client.channels) {
      const subscription = this.channels.get(channel);
      if (subscription) {
        subscription.clientIds.delete(client.id);
        if (subscription.clientIds.size === 0) {
          this.channels.delete(channel);
        }
      }
    }
    client.channels.clear();
  }

  getClientsForChannel(channel: string): Set<string> {
    return this.channels.get(channel)?.clientIds ?? new Set();
  }

  getSubscribedChannels(client: WsClient): string[] {
    return Array.from(client.channels);
  }

  private isValidChannelForClient(client: WsClient, channel: string): boolean {
    const parts = channel.split(':');
    if (parts.length < 2) {
      return false;
    }

    const [type, ...rest] = parts;
    const target = rest.join(':');

    switch (type) {
      case 'price':
      case 'analysis':
        return target.length > 0 && target.length <= 10;
      case 'alert':
        return target === client.userId;
      case 'portfolio':
        return true;
      default:
        return false;
    }
  }
}
