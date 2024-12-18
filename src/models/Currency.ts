import { Model, DataTypes } from "sequelize";
import sequelize from "../database";
import User from "./User";
import type {
    CurrencyAttributes,
    CurrencyCreationAttributes,
} from "./types/currency.types";

class Currency
    extends Model<CurrencyAttributes, CurrencyCreationAttributes>
    implements CurrencyAttributes
{
    public id!: number;
    public userId!: number;
    public balance!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Currency.init(
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
            onDelete: "CASCADE",
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: "currencies",
        timestamps: true,
    }
);

User.hasOne(Currency, { foreignKey: "userId", as: "currency" });
Currency.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Currency;
