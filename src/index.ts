import fs from "node:fs";
import path from "node:path";
import {
    Client,
    Collection,
    CommandInteraction,
    Events,
    GatewayIntentBits,
    Interaction,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

async function loadCommands() {
    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(filePath);

            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(
                    `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }
}

async function handleInteraction(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        await command.execute(interaction as CommandInteraction);
    } catch (error) {
        console.error(
            `Error executing command ${interaction.commandName}:`,
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

async function main() {
    try {
        await loadCommands();

        client.once("ready", () => {
            console.log(`Ready! Logged in as ${client.user?.tag}`);
        });

        client.on(Events.InteractionCreate, handleInteraction);

        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error("An error occurred during bot initialization:", error);
    }
}

main();
