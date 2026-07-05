import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttendanceService } from "./AttendanceService";
import type { IUserRepository } from "../repositories/UserRepository";
import type { IAttendanceRepository } from "../repositories/AttendanceRepository";

function makeUserRepo(): IUserRepository {
    return {
        findByDiscordId: vi.fn(),
        findById: vi.fn(),
        findOrCreate: vi.fn(),
    };
}

function makeAttendanceRepo(): IAttendanceRepository {
    return {
        findLatestForUser: vi.fn(),
        findAllForUser: vi.fn(),
        create: vi.fn(),
    };
}

const at = (h: number, min = 0) => new Date(2026, 0, 6, h, min);

describe("AttendanceService.checkIn", () => {
    let users: IUserRepository;
    let attendance: IAttendanceRepository;
    let service: AttendanceService;

    beforeEach(() => {
        users = makeUserRepo();
        attendance = makeAttendanceRepo();
        service = new AttendanceService(users, attendance);
    });

    it("returns 'closed' outside the attendance window", async () => {
        const result = await service.checkIn("d1", at(10));
        expect(result).toEqual({ status: "closed" });
        expect(users.findByDiscordId).not.toHaveBeenCalled();
    });

    it("returns 'not_registered' when the user is unknown", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue(null);
        const result = await service.checkIn("d1", at(6));
        expect(result).toEqual({ status: "not_registered" });
    });

    it("returns 'already_checked_in' when a record exists for today", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 1 } as never);
        vi.mocked(attendance.findLatestForUser).mockResolvedValue({
            timestamp: at(6),
            consecutiveDays: 2,
            beforeSevenCount: 2,
        } as never);

        const result = await service.checkIn("d1", at(6, 30));
        expect(result).toEqual({ status: "already_checked_in" });
        expect(attendance.create).not.toHaveBeenCalled();
    });

    it("records a first-ever attendance and computes a milestone flag", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 1 } as never);
        vi.mocked(attendance.findLatestForUser).mockResolvedValue(null);

        const result = await service.checkIn("d1", at(6));

        expect(attendance.create).toHaveBeenCalledWith({
            userId: 1,
            timestamp: at(6),
            consecutiveDays: 1,
            beforeSevenCount: 1,
        });
        expect(result).toMatchObject({
            status: "recorded",
            consecutiveDays: 1,
            beforeSevenCount: 1,
            milestone: false,
        });
    });

    it("continues a streak from yesterday", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 1 } as never);
        vi.mocked(attendance.findLatestForUser).mockResolvedValue({
            timestamp: new Date(2026, 0, 5, 6, 0),
            consecutiveDays: 6,
            beforeSevenCount: 6,
        } as never);

        const result = await service.checkIn("d1", at(6));

        expect(result).toMatchObject({
            status: "recorded",
            consecutiveDays: 7,
            beforeSevenCount: 7,
            milestone: true,
        });
    });
});

describe("AttendanceService.getStats", () => {
    let users: IUserRepository;
    let attendance: IAttendanceRepository;
    let service: AttendanceService;

    beforeEach(() => {
        users = makeUserRepo();
        attendance = makeAttendanceRepo();
        service = new AttendanceService(users, attendance);
    });

    it("returns null when the user is not registered", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue(null);
        expect(await service.getStats("d1")).toBeNull();
    });

    it("returns 'no_records' when the user has never attended", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 1 } as never);
        vi.mocked(attendance.findAllForUser).mockResolvedValue([]);
        expect(await service.getStats("d1")).toEqual({ status: "no_records" });
    });

    it("aggregates streak stats (newest record first)", async () => {
        vi.mocked(users.findByDiscordId).mockResolvedValue({ id: 1 } as never);
        vi.mocked(attendance.findAllForUser).mockResolvedValue([
            { timestamp: at(6), consecutiveDays: 3, beforeSevenCount: 2 },
            { timestamp: new Date(2026, 0, 5), consecutiveDays: 5, beforeSevenCount: 4 },
        ] as never);

        const stats = await service.getStats("d1");
        expect(stats).toEqual({
            status: "ok",
            totalRecords: 2,
            currentStreak: 3,
            maxStreak: 5,
            maxBeforeSevenStreak: 4,
            latestAttendance: at(6),
        });
    });
});
