import { describe, it, expect, vi, afterEach } from "vitest";
import Attendance from "../models/Attendance";
import { AttendanceRepository } from "./AttendanceRepository";

const repo = new AttendanceRepository();

afterEach(() => vi.restoreAllMocks());

describe("AttendanceRepository", () => {
    it("findLatestForUser orders by timestamp descending", async () => {
        const findOne = vi
            .spyOn(Attendance, "findOne")
            .mockResolvedValue(null);
        await repo.findLatestForUser(4);
        expect(findOne).toHaveBeenCalledWith({
            where: { userId: 4 },
            order: [["timestamp", "DESC"]],
        });
    });

    it("findAllForUser returns all rows for the user", async () => {
        const findAll = vi
            .spyOn(Attendance, "findAll")
            .mockResolvedValue([] as never);
        await repo.findAllForUser(4);
        expect(findAll).toHaveBeenCalledWith({
            where: { userId: 4 },
            order: [["timestamp", "DESC"]],
        });
    });

    it("create forwards the data and transaction", async () => {
        const create = vi
            .spyOn(Attendance, "create")
            .mockResolvedValue({ id: 1 } as never);
        const data = {
            userId: 4,
            timestamp: new Date(2026, 0, 6),
            consecutiveDays: 1,
            beforeSevenCount: 1,
        };
        await repo.create(data);
        expect(create).toHaveBeenCalledWith(data, { transaction: undefined });
    });
});
