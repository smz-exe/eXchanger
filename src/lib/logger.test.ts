import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "./logger";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("logger", () => {
    it("prefixes info messages and forwards to console.log", () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        logger.info("hello");
        expect(spy).toHaveBeenCalledWith("[INFO] hello");
    });

    it("passes metadata through when provided", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
        logger.warn("careful", { code: 1 });
        expect(spy).toHaveBeenCalledWith("[WARN] careful", { code: 1 });
    });

    it("routes errors to console.error", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        logger.error("boom");
        expect(spy).toHaveBeenCalledWith("[ERROR] boom");
    });
});
