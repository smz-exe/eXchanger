import fs from "node:fs";
import path from "node:path";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { loadCommands } from "./lib/commandLoader";
import { BOT_USERNAME } from "./lib/constants";
import { initDatabase } from "./models";
import { userService } from "./container";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

function registerCommands(): void {
    logger.info("Loading commands...");
    const commands = loadCommands(path.join(__dirname, "commands"));
    for (const command of commands) {
        client.commands.set(command.data.toJSON().name, command);
    }
    logger.info(`Loaded ${client.commands.size} command(s).`);
}

function registerEvents(): void {
    logger.info("Loading events...");
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(
            (file) =>
                (file.endsWith(".ts") || file.endsWith(".js")) &&
                !file.includes(".test.") &&
                !file.endsWith(".d.ts")
        );

    for (const file of eventFiles) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { name, once, execute } = require(
                path.join(eventsPath, file)
            );
            if (!name || typeof execute !== "function") {
                logger.warn(`Invalid event file: ${file}`);
                continue;
            }
            if (once) {
                client.once(name, (...args) => execute(...args, client));
            } else {
                client.on(name, (...args) => execute(...args, client));
            }
            logger.info(`Loaded event: ${name}`);
        } catch (error) {
            logger.error(`Failed to load event from file ${file}`, error);
        }
    }
}

/** Register the bot itself as a user so it can act as the system account. */
async function registerBot(): Promise<void> {
    const { created } = await userService.register(env.CLIENT_ID, BOT_USERNAME);
    logger.info(
        created
            ? `Bot user registered as ${BOT_USERNAME}.`
            : "Bot user already exists in the database."
    );
}

async function main(): Promise<void> {
    logger.info("Initializing bot...");
    try {
        registerCommands();
        registerEvents();

        await initDatabase();
        await registerBot();

        await client.login(env.DISCORD_TOKEN);
        logger.info("Bot logged in successfully.");
    } catch (error) {
        logger.error("Bot initialization failed", error);
        process.exit(1);
    }
}

void main();
