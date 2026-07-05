import type { Transaction as DbTransaction } from "sequelize";
import Currency from "../models/Currency";

export interface ICurrencyRepository {
    findByUserId(userId: number): Promise<Currency | null>;
    getBalance(userId: number): Promise<number>;
    findOrCreateForUser(
        userId: number,
        transaction?: DbTransaction
    ): Promise<Currency>;
    addBalance(
        userId: number,
        amount: number,
        transaction?: DbTransaction
    ): Promise<Currency>;
}

export class CurrencyRepository implements ICurrencyRepository {
    async findByUserId(userId: number): Promise<Currency | null> {
        return Currency.findOne({ where: { userId } });
    }

    async getBalance(userId: number): Promise<number> {
        const currency = await this.findByUserId(userId);
        return currency?.balance ?? 0;
    }

    async findOrCreateForUser(
        userId: number,
        transaction?: DbTransaction
    ): Promise<Currency> {
        const [currency] = await Currency.findOrCreate({
            where: { userId },
            defaults: { userId, balance: 0 },
            transaction,
        });
        return currency;
    }

    /**
     * Atomically add `amount` (may be negative) to a user's balance using an
     * in-database increment, avoiding read-modify-write races. Returns the
     * refreshed row.
     */
    async addBalance(
        userId: number,
        amount: number,
        transaction?: DbTransaction
    ): Promise<Currency> {
        const currency = await this.findOrCreateForUser(userId, transaction);
        await currency.increment("balance", { by: amount, transaction });
        await currency.reload({ transaction });
        return currency;
    }
}
