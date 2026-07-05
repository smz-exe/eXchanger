/* eslint-disable no-console */

/**
 * Minimal leveled logger. Wraps `console` so call sites never touch it
 * directly and we get a consistent `[LEVEL]` prefix. Swap the sink here if a
 * real logging backend (pino, winston, …) is introduced later.
 */
type LogLevel = "INFO" | "WARN" | "ERROR";

function emit(level: LogLevel, message: string, meta?: unknown): void {
    const line = `[${level}] ${message}`;
    const sink =
        level === "ERROR"
            ? console.error
            : level === "WARN"
              ? console.warn
              : console.log;

    if (meta !== undefined) {
        sink(line, meta);
    } else {
        sink(line);
    }
}

export const logger = {
    info: (message: string, meta?: unknown) => emit("INFO", message, meta),
    warn: (message: string, meta?: unknown) => emit("WARN", message, meta),
    error: (message: string, meta?: unknown) => emit("ERROR", message, meta),
};
