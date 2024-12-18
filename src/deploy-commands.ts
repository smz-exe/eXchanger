import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { Command } from "./types/commands.types";

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID!;

const commands: object[] = [];

function isValidCommand(command: any): command is Command {
    const data = command?.data?.toJSON?.();
    return (
        data &&
        typeof command.execute === "function" &&
        typeof data.name === "string" &&
        typeof data.description === "string"
    );
}

async function loadCommands() {
    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command: Partial<Command> = require(filePath);

                if (isValidCommand(command)) {
                    commands.push(command.data.toJSON());
                    console.log(
                        `[INFO] Loaded command: ${command.data.toJSON().name}`
                    );
                } else {
                    console.warn(
                        `[WARNING] Invalid command at ${filePath}. Missing "data" or "execute" property.`
                    );
                }
            } catch (error) {
                console.error(
                    `[ERROR] Failed to load command at ${filePath}:`,
                    error
                );
            }
        }
    }
}

async function deployCommands() {
    const rest = new REST({ version: "10" }).setToken(token);

    try {
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`
        );

        const data = (await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        )) as any[];

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    } catch (error) {
        console.error(`[ERROR] Failed to deploy commands:`, error);
    }
}

async function main() {
    try {
        await loadCommands();
        await deployCommands();
    } catch (error) {
        console.error("[CRITICAL] An error occurred in main:", error);
    }
}

main();
