import { differenceInCalendarDays } from "date-fns";
import { ATTENDANCE } from "../../lib/constants";

/**
 * Pure attendance-streak calculations. This module intentionally has no
 * database, Discord, or environment dependencies so it can be unit-tested in
 * isolation.
 */

export interface StreakSnapshot {
    timestamp: Date;
    consecutiveDays: number;
    beforeSevenCount: number;
}

export interface StreakResult {
    consecutiveDays: number;
    beforeSevenCount: number;
}

/** True if `date` is at or before the early-bird cutoff (07:00). */
export function isBeforeOrAtSeven(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return (
        hour < ATTENDANCE.EARLY_HOUR ||
        (hour === ATTENDANCE.EARLY_HOUR && minute === 0)
    );
}

/** True if `date` falls within the attendance window (05:00–09:00). */
export function isWithinAttendancePeriod(date: Date): boolean {
    const hour = date.getHours();
    return hour >= ATTENDANCE.OPEN_HOUR && hour < ATTENDANCE.CLOSE_HOUR;
}

/** True when a streak count hits the milestone interval (and is non-zero). */
export function isMilestone(
    consecutiveDays: number,
    beforeSevenCount: number
): boolean {
    const hit = (n: number) => n > 0 && n % ATTENDANCE.MILESTONE_INTERVAL === 0;
    return hit(consecutiveDays) || hit(beforeSevenCount);
}

/**
 * Compute the new streak counters given the current check-in time and the
 * user's most recent attendance record (or null for a first check-in).
 *
 * The streak only continues when the previous attendance was exactly one
 * calendar day earlier; any larger gap resets it to 1.
 */
export function computeStreak(
    now: Date,
    last: StreakSnapshot | null
): StreakResult {
    const earlyNow = isBeforeOrAtSeven(now);

    if (!last) {
        return { consecutiveDays: 1, beforeSevenCount: earlyNow ? 1 : 0 };
    }

    const isConsecutive = differenceInCalendarDays(now, last.timestamp) === 1;

    if (!isConsecutive) {
        return { consecutiveDays: 1, beforeSevenCount: earlyNow ? 1 : 0 };
    }

    const consecutiveDays = last.consecutiveDays + 1;
    const earlyLast = isBeforeOrAtSeven(last.timestamp);
    const beforeSevenCount =
        earlyLast && earlyNow ? last.beforeSevenCount + 1 : earlyNow ? 1 : 0;

    return { consecutiveDays, beforeSevenCount };
}
