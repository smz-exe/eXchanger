import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger";
import type { Command } from "../types/commands.types";

/** Type guard: a module is a valid slash command with data + execute. */
export function isValidCommand(command: unknown): command is Command {
    const candidate = command as Partial<Command> | undefined;
    const data = candidate?.data?.toJSON?.();
    return (
        !!data &&
        typeof candidate?.execute === "function" &&
        typeof data.name === "string" &&
        typeof data.description === "string"
    );
}

function isCommandFile(file: string): boolean {
    const isSource = file.endsWith(".ts") || file.endsWith(".js");
    const isTest = file.includes(".test.") || file.endsWith(".d.ts");
    return isSource && !isTest;
}

/**
 * Recursively load every valid command module under `commandsDir`
 * (one level of feature folders). Invalid files are skipped with a warning.
 */
export function loadCommands(commandsDir: string): Command[] {
    const commands: Command[] = [];
    const folders = fs.readdirSync(commandsDir);

    for (const folder of folders) {
        const folderPath = path.join(commandsDir, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const files = fs.readdirSync(folderPath).filter(isCommandFile);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const mod = require(filePath);
                if (isValidCommand(mod)) {
                    commands.push(mod);
                    logger.info(`Loaded command: ${mod.data.toJSON().name}`);
                } else {
                    logger.warn(
                        `Skipped invalid command file (missing data/execute): ${filePath}`
                    );
                }
            } catch (error) {
                logger.error(`Failed to load command at ${filePath}`, error);
            }
        }
    }

    return commands;
}
