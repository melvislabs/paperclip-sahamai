export class ChannelManager {
    channels = new Map();
    subscribe(client, channel) {
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
    unsubscribe(client, channel) {
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
    unsubscribeAll(client) {
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
    getClientsForChannel(channel) {
        return this.channels.get(channel)?.clientIds ?? new Set();
    }
    getSubscribedChannels(client) {
        return Array.from(client.channels);
    }
    isValidChannelForClient(client, channel) {
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
