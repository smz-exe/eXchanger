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
    } catch (error) {
        console.error("[ERROR] Failed to load commands:", error);
    }
}

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `[ERROR] No matching command for: ${interaction.commandName}`
        );
        return;
    }

    try {
        await command.execute(interaction as CommandInteraction);
    } catch (error) {
        console.error(
            `[ERROR] Failed to execute command ${interaction.commandName}:`,
            error
        );

        const replyOptions = {
            content: "There was an error while executing this command!",
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
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
        console.log("[INFO] Commands loaded successfully.");

        client.once("ready", async () => {
            if (client.user) {
                client.user.setActivity("default", {
                    type: ActivityType.Custom,
                    state: "Just Do It ☑️",
                });
            } else {
                console.error("[ERROR] Client user is null.");
            }
            console.log(
                `[INFO] Bot is ready! Logged in as ${client.user?.tag}`
            );
        });

        client.on(Events.InteractionCreate, handleInteraction);

        await client.login(process.env.TOKEN);
        console.log("[INFO] Bot logged in successfully.");

        await setupDatabase();
    } catch (error) {
        console.error("[CRITICAL] Bot initialization failed:", error);
        process.exit(1);
    }
}

main();
