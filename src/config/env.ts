import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Schema for all environment variables the bot requires.
 * Validation happens once at startup so the process fails fast with a
 * clear message instead of blowing up deep inside a command handler.
 */
const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
    CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),
    GUILD_ID: z.string().min(1, "GUILD_ID is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    DB_NAME: z.string().min(1, "DB_NAME is required"),
    DB_USERNAME: z.string().min(1, "DB_USERNAME is required"),
    DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
    DB_HOST: z.string().min(1).default("localhost"),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate `process.env`. Throws an aggregated, human-readable
 * error listing every missing/invalid variable.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
    const result = envSchema.safeParse(source);

    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        throw new Error(
            `Invalid environment configuration:\n${issues}\n` +
                "Check your .env file against .env.example."
        );
    }

    return result.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
