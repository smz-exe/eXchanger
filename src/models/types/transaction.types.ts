export interface TransactionAttributes {
    id: number;
    userId: number;
    type: "earn" | "spend";
    amount: number;
    reason: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TransactionCreationAttributes
    extends Omit<TransactionAttributes, "id"> {}
