import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../database";
import type { UserAttributes } from "./types/user.types";

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes
{
    public id!: number;
    public discordId!: string;
    public username!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "users",
        timestamps: true,
    }
);

export default User;
