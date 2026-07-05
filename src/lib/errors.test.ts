import { describe, it, expect } from "vitest";
import {
    AppError,
    UserNotRegisteredError,
    PermissionDeniedError,
    ConfigurationError,
    isAppError,
} from "./errors";

describe("AppError", () => {
    it("defaults userMessage to the technical message", () => {
        const err = new AppError("boom");
        expect(err.userMessage).toBe("boom");
        expect(err.name).toBe("AppError");
    });

    it("keeps a distinct user-facing message when provided", () => {
        const err = new AppError("internal detail", "friendly message");
        expect(err.message).toBe("internal detail");
        expect(err.userMessage).toBe("friendly message");
    });
});

describe("domain errors", () => {
    it("UserNotRegisteredError carries a register hint", () => {
        const err = new UserNotRegisteredError();
        expect(err).toBeInstanceOf(AppError);
        expect(err.userMessage).toContain("/register");
    });

    it("PermissionDeniedError has a permission message", () => {
        expect(new PermissionDeniedError().userMessage).toContain(
            "permission"
        );
    });

    it("ConfigurationError hides internals from users", () => {
        const err = new ConfigurationError("missing SECRET_KEY");
        expect(err.message).toBe("missing SECRET_KEY");
        expect(err.userMessage).not.toContain("SECRET_KEY");
    });
});

describe("isAppError", () => {
    it("recognises AppError instances", () => {
        expect(isAppError(new ConfigurationError("x"))).toBe(true);
    });

    it("rejects plain errors and non-errors", () => {
        expect(isAppError(new Error("x"))).toBe(false);
        expect(isAppError("nope")).toBe(false);
        expect(isAppError(null)).toBe(false);
    });
});
