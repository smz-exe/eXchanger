/** Domain-wide constants. Keep magic numbers/strings out of business logic. */

/** Attendance can only be marked within this hour window (local time). */
export const ATTENDANCE = {
    /** Inclusive start hour (5:00 AM). */
    OPEN_HOUR: 5,
    /** Exclusive end hour (9:00 AM). */
    CLOSE_HOUR: 9,
    /** Marking at or before this hour counts toward the "early bird" streak. */
    EARLY_HOUR: 7,
    /** Streak length that triggers a milestone celebration. */
    MILESTONE_INTERVAL: 7,
} as const;

/** The reason recorded when an admin grants Jam via `/addjam`. */
export const ADMIN_GRANT_REASON = "Admin granted Jam.";

/** Embed colors used across command responses. */
export const COLORS = {
    SUCCESS: 0x00ff00,
    INFO: 0x0099ff,
    WARNING: 0xffcc00,
    ERROR: 0xff0000,
} as const;

/** The bot's own display name, stored in the users table. */
export const BOT_USERNAME = "eXchanger";

/** Gemini model used for attendance analysis. */
export const GEMINI_MODEL = "gemini-2.5-flash";

/** Max transactions rendered in the `/transactions` embed. */
export const TRANSACTION_HISTORY_LIMIT = 10;
