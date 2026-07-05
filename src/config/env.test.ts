import { describe, it, expect } from "vitest";
import { loadEnv } from "./env";

const validSource = {
    DISCORD_TOKEN: "token",
    CLIENT_ID: "client",
    GUILD_ID: "guild",
    GEMINI_API_KEY: "gemini",
    DB_NAME: "db",
    DB_USERNAME: "user",
    DB_PASSWORD: "pw",
};

describe("loadEnv", () => {
    it("parses a valid environment and applies defaults", () => {
        const env = loadEnv(validSource as NodeJS.ProcessEnv);
        expect(env.DB_HOST).toBe("localhost");
        expect(env.DB_PORT).toBe(5432);
        expect(env.NODE_ENV).toBe("development");
    });

    it("coerces DB_PORT to a number", () => {
        const env = loadEnv({
            ...validSource,
            DB_PORT: "6543",
        } as NodeJS.ProcessEnv);
        expect(env.DB_PORT).toBe(6543);
    });

    it("throws a descriptive error when required vars are missing", () => {
        expect(() => loadEnv({} as NodeJS.ProcessEnv)).toThrow(
            /Invalid environment configuration/
        );
    });

    it("lists each missing variable in the error", () => {
        try {
            loadEnv({ DISCORD_TOKEN: "t" } as NodeJS.ProcessEnv);
            expect.unreachable("should have thrown");
        } catch (error) {
            expect((error as Error).message).toContain("CLIENT_ID");
            expect((error as Error).message).toContain("DB_NAME");
        }
    });

    it("rejects an invalid NODE_ENV", () => {
        expect(() =>
            loadEnv({
                ...validSource,
                NODE_ENV: "staging",
            } as NodeJS.ProcessEnv)
        ).toThrow(/Invalid environment configuration/);
    });
});
