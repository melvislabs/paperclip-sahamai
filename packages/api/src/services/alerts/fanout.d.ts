export interface SignalPublishedEvent {
    signal: {
        symbol: string;
        action: string;
        confidence: number;
        reasonCodes: string[];
        generatedAt: string;
    };
    publishedAt: string;
}
export interface DeliveryDestination {
    recipient: string;
}
export interface DeliveryAttempt {
    id: string;
    destination: DeliveryDestination;
    event: SignalPublishedEvent;
    attemptNumber: number;
}
export interface DeliveryAdapter {
    send(attempt: DeliveryAttempt): Promise<void>;
}
