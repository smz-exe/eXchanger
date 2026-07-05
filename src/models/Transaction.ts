import { Model, DataTypes } from "sequelize";
import sequelize from "../db/sequelize";
import User from "./User";
import type {
    TransactionAttributes,
    TransactionCreationAttributes,
    TransactionType,
} from "./types/transaction.types";

const TRANSACTION_TYPES: TransactionType[] = ["earn", "spend", "transfer"];

class Transaction
    extends Model<TransactionAttributes, TransactionCreationAttributes>
    implements TransactionAttributes
{
    public id!: number;
    public userId!: number;
    public senderId!: number | null;
    public recipientId!: number | null;
    public type!: TransactionType;
    public amount!: number;
    public reason!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Transaction.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: User,
                key: "id",
            },
        },
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: User,
                key: "id",
            },
        },
        type: {
            type: DataTypes.ENUM(...TRANSACTION_TYPES),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "transactions",
        timestamps: true,
        indexes: [
            { fields: ["userId"] },
            { fields: ["senderId"] },
            { fields: ["recipientId"] },
        ],
    }
);

export default Transaction;
