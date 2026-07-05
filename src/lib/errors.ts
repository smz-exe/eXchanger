/**
 * Base class for errors that carry a message safe to show to end users.
 * Command handlers can render `userMessage` directly; unexpected errors
 * (anything not an AppError) fall back to a generic message.
 */
export class AppError extends Error {
    public readonly userMessage: string;

    constructor(message: string, userMessage?: string) {
        super(message);
        this.name = new.target.name;
        this.userMessage = userMessage ?? message;
        Error.captureStackTrace?.(this, new.target);
    }
}

/** The Discord user has not run `/register` yet. */
export class UserNotRegisteredError extends AppError {
    constructor(target = "You are") {
        super(
            "User is not registered",
            `❌ ${target} not registered in the system. Please use \`/register\` to sign up first.`
        );
    }
}

/** The invoking member lacks the required permission for a command. */
export class PermissionDeniedError extends AppError {
    constructor() {
        super(
            "Missing required permission",
            "❌ You do not have permission to use this command."
        );
    }
}

/** A required piece of configuration is missing or a system invariant broke. */
export class ConfigurationError extends AppError {
    constructor(message: string) {
        super(
            message,
            "⚠️ The bot is misconfigured. Please contact an administrator."
        );
    }
}

export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}
