import { Model, DataTypes } from "sequelize";
import sequelize from "../database";
import User from "./User";
import type {
    TransactionAttributes,
    TransactionCreationAttributes,
} from "./types/transaction.types";

class Transaction
    extends Model<TransactionAttributes, TransactionCreationAttributes>
    implements TransactionAttributes
{
    public id!: number;
    public userId!: number;
    public senderId!: number;
    public recipientId!: number;
    public type!: "earn" | "spend";
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
            type: DataTypes.ENUM("earn", "spend"),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
    }
);

User.hasMany(Transaction, { foreignKey: "userId", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Transaction;
