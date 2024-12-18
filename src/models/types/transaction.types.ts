export interface TransactionAttributes {
    id: number;
    userId: number;
    senderId?: number;
    recipientId?: number;
    type: "earn" | "spend" | "transfer";
    amount: number;
    reason: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TransactionCreationAttributes
    extends Omit<TransactionAttributes, "id"> {}
