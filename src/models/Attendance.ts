import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../database";
import User from "./User";

interface AttendanceAttributes {
    id: number;
    userId: number;
    timestamp: Date;
}

interface AttendanceCreationAttributes
    extends Optional<AttendanceAttributes, "id"> {}

class Attendance
    extends Model<AttendanceAttributes, AttendanceCreationAttributes>
    implements AttendanceAttributes
{
    public id!: number;
    public userId!: number;
    public timestamp!: Date;

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
        },
    },
    {
        sequelize,
        tableName: "attendance",
        timestamps: true,
    }
);

User.hasMany(Attendance, { foreignKey: "userId", as: "attendances" });
Attendance.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Attendance;
