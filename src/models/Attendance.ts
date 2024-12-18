import { Model, DataTypes } from "sequelize";
import sequelize from "../database";
import User from "./User";
import type {
    AttendanceAttributes,
    AttendanceCreationAttributes,
} from "./types/attendance.types";

class Attendance
    extends Model<AttendanceAttributes, AttendanceCreationAttributes>
    implements AttendanceAttributes
{
    public id!: number;
    public userId!: number;
    public timestamp!: Date;
    public consecutiveDays!: number;
    public beforeSevenCount!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Attendance.init(
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
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        consecutiveDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        beforeSevenCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: "attendance",
        timestamps: true,
        indexes: [
            {
                fields: ["userId", "timestamp"],
            },
        ],
    }
);

User.hasMany(Attendance, { foreignKey: "userId", as: "attendances" });
Attendance.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Attendance;
