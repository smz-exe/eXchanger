import path from "node:path";
import { REST, Routes } from "discord.js";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { loadCommands } from "./lib/commandLoader";

async function deployCommands(): Promise<void> {
    const commands = loadCommands(path.join(__dirname, "commands")).map(
        (command) => command.data.toJSON()
    );

    const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

    logger.info(
        `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = (await rest.put(
        Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
        { body: commands }
    )) as unknown[];

    logger.info(
        `Successfully reloaded ${data.length} application (/) commands.`
    );
}

async function main(): Promise<void> {
    try {
        await deployCommands();
    } catch (error) {
        logger.error("Failed to deploy commands", error);
        process.exit(1);
    }
}

void main();
