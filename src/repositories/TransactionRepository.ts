import { Op } from "sequelize";
import type { Transaction as DbTransaction } from "sequelize";
import Transaction from "../models/Transaction";
import type { TransactionCreationAttributes } from "../models/types/transaction.types";

export interface ITransactionRepository {
    create(
        data: TransactionCreationAttributes,
        transaction?: DbTransaction
    ): Promise<Transaction>;
    findForUser(userId: number, limit?: number): Promise<Transaction[]>;
}

export class TransactionRepository implements ITransactionRepository {
    async create(
        data: TransactionCreationAttributes,
        transaction?: DbTransaction
    ): Promise<Transaction> {
        return Transaction.create(data, { transaction });
    }

    /**
     * Return the user's transactions (as user, sender, or recipient), newest
     * first. `limit` caps the number of rows fetched.
     */
    async findForUser(userId: number, limit?: number): Promise<Transaction[]> {
        return Transaction.findAll({
            where: {
                [Op.or]: [
                    { userId },
                    { senderId: userId },
                    { recipientId: userId },
                ],
            },
            order: [["createdAt", "DESC"]],
            ...(limit ? { limit } : {}),
        });
    }
}
