import { describe, it, expect } from "vitest";
import {
    isBeforeOrAtSeven,
    isWithinAttendancePeriod,
    isMilestone,
    computeStreak,
    type StreakSnapshot,
} from "./streak";

/** Local-time date helper (month is 0-indexed). */
function at(y: number, m: number, d: number, h: number, min = 0): Date {
    return new Date(y, m, d, h, min);
}

describe("isBeforeOrAtSeven", () => {
    it("is true before 07:00", () => {
        expect(isBeforeOrAtSeven(at(2026, 0, 5, 6, 59))).toBe(true);
        expect(isBeforeOrAtSeven(at(2026, 0, 5, 5, 0))).toBe(true);
    });

    it("is true exactly at 07:00", () => {
        expect(isBeforeOrAtSeven(at(2026, 0, 5, 7, 0))).toBe(true);
    });

    it("is false after 07:00", () => {
        expect(isBeforeOrAtSeven(at(2026, 0, 5, 7, 1))).toBe(false);
        expect(isBeforeOrAtSeven(at(2026, 0, 5, 8, 30))).toBe(false);
    });
});

describe("isWithinAttendancePeriod", () => {
    it("accepts times within 05:00–09:00", () => {
        expect(isWithinAttendancePeriod(at(2026, 0, 5, 5, 0))).toBe(true);
        expect(isWithinAttendancePeriod(at(2026, 0, 5, 8, 59))).toBe(true);
    });

    it("rejects times outside the window", () => {
        expect(isWithinAttendancePeriod(at(2026, 0, 5, 4, 59))).toBe(false);
        expect(isWithinAttendancePeriod(at(2026, 0, 5, 9, 0))).toBe(false);
        expect(isWithinAttendancePeriod(at(2026, 0, 5, 23, 0))).toBe(false);
    });
});

describe("isMilestone", () => {
    it("is true when either counter is a non-zero multiple of 7", () => {
        expect(isMilestone(7, 0)).toBe(true);
        expect(isMilestone(14, 3)).toBe(true);
        expect(isMilestone(2, 7)).toBe(true);
    });

    it("is false at zero", () => {
        expect(isMilestone(0, 0)).toBe(false);
    });

    it("is false for non-multiples of 7", () => {
        expect(isMilestone(6, 6)).toBe(false);
        expect(isMilestone(8, 1)).toBe(false);
    });
});

describe("computeStreak", () => {
    it("starts a fresh streak when there is no prior record (early)", () => {
        expect(computeStreak(at(2026, 0, 5, 6, 0), null)).toEqual({
            consecutiveDays: 1,
            beforeSevenCount: 1,
        });
    });

    it("starts a fresh streak when there is no prior record (late)", () => {
        expect(computeStreak(at(2026, 0, 5, 8, 0), null)).toEqual({
            consecutiveDays: 1,
            beforeSevenCount: 0,
        });
    });

    it("increments both counters on consecutive early check-ins", () => {
        const last: StreakSnapshot = {
            timestamp: at(2026, 0, 5, 6, 0),
            consecutiveDays: 3,
            beforeSevenCount: 3,
        };
        expect(computeStreak(at(2026, 0, 6, 6, 30), last)).toEqual({
            consecutiveDays: 4,
            beforeSevenCount: 4,
        });
    });

    it("continues the day streak but resets early-count when now is late", () => {
        const last: StreakSnapshot = {
            timestamp: at(2026, 0, 5, 6, 0),
            consecutiveDays: 3,
            beforeSevenCount: 3,
        };
        expect(computeStreak(at(2026, 0, 6, 8, 0), last)).toEqual({
            consecutiveDays: 4,
            beforeSevenCount: 0,
        });
    });

    it("restarts early-count at 1 when previous was late but now is early", () => {
        const last: StreakSnapshot = {
            timestamp: at(2026, 0, 5, 8, 0),
            consecutiveDays: 2,
            beforeSevenCount: 0,
        };
        expect(computeStreak(at(2026, 0, 6, 6, 0), last)).toEqual({
            consecutiveDays: 3,
            beforeSevenCount: 1,
        });
    });

    it("resets the streak when a day was skipped", () => {
        const last: StreakSnapshot = {
            timestamp: at(2026, 0, 5, 6, 0),
            consecutiveDays: 5,
            beforeSevenCount: 5,
        };
        expect(computeStreak(at(2026, 0, 7, 6, 0), last)).toEqual({
            consecutiveDays: 1,
            beforeSevenCount: 1,
        });
    });
});
