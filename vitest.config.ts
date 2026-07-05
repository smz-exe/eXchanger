import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["src/**/*.test.ts"],
        // Provide dummy config so modules that import `config/env` (which
        // validates on load) can be imported without a real .env.
        env: {
            NODE_ENV: "test",
            DISCORD_TOKEN: "test-token",
            CLIENT_ID: "test-client-id",
            GUILD_ID: "test-guild-id",
            GEMINI_API_KEY: "test-gemini-key",
            DB_NAME: "test_db",
            DB_USERNAME: "test_user",
            DB_PASSWORD: "test_password",
            DB_HOST: "localhost",
            DB_PORT: "5432",
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "src/**/*.test.ts",
                "src/@types/**",
                "src/**/types/**",
                "src/types/**",
                "src/index.ts",
                "src/deploy-commands.ts",
                "src/container.ts",
                "src/db/**",
                "src/models/**",
                "src/events/**",
                "src/commands/**",
                "src/lib/constants.ts",
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
});
