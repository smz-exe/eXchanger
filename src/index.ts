import fs from "node:fs";
import path from "node:path";
import {
    ActivityType,
    Client,
    Collection,
    CommandInteraction,
    Events,
    GatewayIntentBits,
    Interaction,
} from "discord.js";
import dotenv from "dotenv";
import sequelize from "./database";
import type { Command } from "./types";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection<string, Command>();

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
    console.log("[INFO] Loading commands...");
    try {
        const foldersPath = path.join(__dirname, "commands");
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs
                .readdirSync(commandsPath)
                .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command: Partial<Command> = require(filePath);

                if (isValidCommand(command)) {
                    client.commands.set(command.data.toJSON().name, command);
                    console.log(
                        `[INFO] Loaded command: ${command.data.toJSON().name}`
                    );
                } else {
                    console.warn(
                        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                    );
                }
            }
        }
        console.log("[INFO] Commands loaded successfully.");
    } catch (error) {
        console.error("[ERROR] Failed to load commands:", error);
    }
}

async function loadEvents() {
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of eventFiles) {
        const { name, once, execute } = require(path.join(eventsPath, file));
        if (name && execute) {
            if (once) {
                client.once(name, (...args) => execute(...args, client));
            } else {
                client.on(name, (...args) => execute(...args, client));
            }
            console.log(`[INFO] Loaded event: ${name}`);
        } else {
            console.warn(`[WARNING] Invalid event file: ${file}`);
        }
    }
    console.log("[INFO] Events loaded successfully.");
}

async function setupDatabase() {
    try {
        await sequelize.authenticate();
        console.log("[INFO] Database connection established successfully.");

        await sequelize.sync({ alter: true });
        console.log("[INFO] Models synchronized successfully.");
    } catch (error) {
        console.error("[ERROR] Failed to setup database:", error);
        throw error;
    }
}

async function main() {
    console.log("[INFO] Initializing bot...");

    try {
        await loadCommands();
        await loadEvents();
        await setupDatabase();

        await client.login(process.env.TOKEN);
        console.log("[INFO] Bot logged in successfully.");
    } catch (error) {
        console.error("[CRITICAL] Bot initialization failed:", error);
        process.exit(1);
    }
}

main();
