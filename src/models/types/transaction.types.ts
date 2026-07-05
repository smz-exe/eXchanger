export type TransactionType = "earn" | "spend" | "transfer";

export interface TransactionAttributes {
    id: number;
    userId: number;
    senderId: number | null;
    recipientId: number | null;
    type: TransactionType;
    amount: number;
    reason: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export type TransactionCreationAttributes = Omit<
    TransactionAttributes,
    "id" | "createdAt" | "updatedAt"
>;
