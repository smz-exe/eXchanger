import { isSameDay } from "date-fns";
import type { IUserRepository } from "../repositories/UserRepository";
import type { IAttendanceRepository } from "../repositories/AttendanceRepository";
import {
    computeStreak,
    isMilestone,
    isWithinAttendancePeriod,
} from "./attendance/streak";

export type AttendanceResult =
    | { status: "closed" }
    | { status: "not_registered" }
    | { status: "already_checked_in" }
    | {
          status: "recorded";
          consecutiveDays: number;
          beforeSevenCount: number;
          milestone: boolean;
          at: Date;
      };

/**
 * Coordinates the attendance check-in flow: window validation, registration
 * lookup, duplicate-per-day guard, streak calculation, and persistence.
 * All Discord rendering lives in the command adapter, not here.
 */
export class AttendanceService {
    constructor(
        private readonly users: IUserRepository,
        private readonly attendance: IAttendanceRepository
    ) {}

    async checkIn(discordId: string, now: Date): Promise<AttendanceResult> {
        if (!isWithinAttendancePeriod(now)) {
            return { status: "closed" };
        }

        const user = await this.users.findByDiscordId(discordId);
        if (!user) {
            return { status: "not_registered" };
        }

        const last = await this.attendance.findLatestForUser(user.id);
        if (last && isSameDay(new Date(last.timestamp), now)) {
            return { status: "already_checked_in" };
        }

        const { consecutiveDays, beforeSevenCount } = computeStreak(
            now,
            last
                ? {
                      timestamp: new Date(last.timestamp),
                      consecutiveDays: last.consecutiveDays,
                      beforeSevenCount: last.beforeSevenCount,
                  }
                : null
        );

        await this.attendance.create({
            userId: user.id,
            timestamp: now,
            consecutiveDays,
            beforeSevenCount,
        });

        return {
            status: "recorded",
            consecutiveDays,
            beforeSevenCount,
            milestone: isMilestone(consecutiveDays, beforeSevenCount),
            at: now,
        };
    }

    /**
     * Aggregate a user's attendance stats for the `/record` command.
     * Returns null when the user is not registered.
     */
    async getStats(discordId: string): Promise<
        | null
        | { status: "no_records" }
        | {
              status: "ok";
              totalRecords: number;
              currentStreak: number;
              maxStreak: number;
              maxBeforeSevenStreak: number;
              latestAttendance: Date;
          }
    > {
        const user = await this.users.findByDiscordId(discordId);
        if (!user) {
            return null;
        }

        const records = await this.attendance.findAllForUser(user.id);
        if (records.length === 0) {
            return { status: "no_records" };
        }

        const latest = records[0];
        return {
            status: "ok",
            totalRecords: records.length,
            currentStreak: latest.consecutiveDays,
            maxStreak: Math.max(...records.map((r) => r.consecutiveDays)),
            maxBeforeSevenStreak: Math.max(
                ...records.map((r) => r.beforeSevenCount)
            ),
            latestAttendance: new Date(latest.timestamp),
        };
    }
}
