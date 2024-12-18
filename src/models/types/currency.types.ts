export interface CurrencyAttributes {
    id: number;
    userId: number;
    balance: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CurrencyCreationAttributes
    extends Omit<CurrencyAttributes, "id"> {}
