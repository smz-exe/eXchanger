import type { Transaction as DbTransaction } from "sequelize";
import Attendance from "../models/Attendance";
import type { AttendanceCreationAttributes } from "../models/types/attendance.types";

export interface IAttendanceRepository {
    findLatestForUser(userId: number): Promise<Attendance | null>;
    findAllForUser(userId: number): Promise<Attendance[]>;
    create(
        data: AttendanceCreationAttributes,
        transaction?: DbTransaction
    ): Promise<Attendance>;
}

export class AttendanceRepository implements IAttendanceRepository {
    async findLatestForUser(userId: number): Promise<Attendance | null> {
        return Attendance.findOne({
            where: { userId },
            order: [["timestamp", "DESC"]],
        });
    }

    async findAllForUser(userId: number): Promise<Attendance[]> {
        return Attendance.findAll({
            where: { userId },
            order: [["timestamp", "DESC"]],
        });
    }

    async create(
        data: AttendanceCreationAttributes,
        transaction?: DbTransaction
    ): Promise<Attendance> {
        return Attendance.create(data, { transaction });
    }
}
