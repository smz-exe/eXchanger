import type { Transaction as DbTransaction } from "sequelize";
import type { IUserRepository } from "../repositories/UserRepository";
import type { ICurrencyRepository } from "../repositories/CurrencyRepository";
import type { ITransactionRepository } from "../repositories/TransactionRepository";
import type TransactionModel from "../models/Transaction";
import { ConfigurationError } from "../lib/errors";
import { ADMIN_GRANT_REASON } from "../lib/constants";

/**
 * Runs a unit of work inside a managed DB transaction. Satisfied by the
 * Sequelize instance's `transaction()` method; a fake can be injected in tests.
 */
export interface TransactionRunner {
    transaction<T>(fn: (t: DbTransaction) => Promise<T>): Promise<T>;
}

export type AddJamResult =
    | { status: "recipient_not_registered" }
    | { status: "ok"; newBalance: number };

export class CurrencyService {
    constructor(
        private readonly users: IUserRepository,
        private readonly currencies: ICurrencyRepository,
        private readonly transactions: ITransactionRepository,
        private readonly runner: TransactionRunner
    ) {}

    /**
     * Grant `amount` Jam to a user on behalf of the system (bot) account.
     * The balance update and the transaction record are written atomically:
     * if either fails, both roll back.
     *
     * @throws {ConfigurationError} when the system/bot user is not registered.
     */
    async addJam(
        botDiscordId: string,
        recipientDiscordId: string,
        amount: number,
        reason: string = ADMIN_GRANT_REASON
    ): Promise<AddJamResult> {
        const systemUser = await this.users.findByDiscordId(botDiscordId);
        if (!systemUser) {
            throw new ConfigurationError(
                "System (bot) user is not registered in the database."
            );
        }

        const recipient = await this.users.findByDiscordId(recipientDiscordId);
        if (!recipient) {
            return { status: "recipient_not_registered" };
        }

        const newBalance = await this.runner.transaction(async (t) => {
            const currency = await this.currencies.addBalance(
                recipient.id,
                amount,
                t
            );
            await this.transactions.create(
                {
                    userId: systemUser.id,
                    senderId: systemUser.id,
                    recipientId: recipient.id,
                    type: "earn",
                    amount,
                    reason,
                },
                t
            );
            return currency.balance;
        });

        return { status: "ok", newBalance };
    }

    /** Current balance for a Discord user, or null if not registered. */
    async getBalance(discordId: string): Promise<number | null> {
        const user = await this.users.findByDiscordId(discordId);
        if (!user) {
            return null;
        }
        return this.currencies.getBalance(user.id);
    }

    /**
     * Transaction history for a Discord user (newest first), or null if not
     * registered.
     */
    async getHistory(
        discordId: string,
        limit?: number
    ): Promise<{ userId: number; transactions: TransactionModel[] } | null> {
        const user = await this.users.findByDiscordId(discordId);
        if (!user) {
            return null;
        }
        const transactions = await this.transactions.findForUser(
            user.id,
            limit
        );
        return { userId: user.id, transactions };
    }
}
