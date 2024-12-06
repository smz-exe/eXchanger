import fs from "node:fs";
import path from "node:path";
import {
    Message,
    Client,
    Collection,
    Events,
    TextChannel,
    DMChannel,
    NewsChannel,
    MessageFlags,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
    intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

client.once("ready", () => {
    console.log("Ready!");
    console.log(client.user?.tag);
});

client.on("messageCreate", async (message: Message) => {
    console.log(`Message received: ${message.content}`);

    if (message.author.bot) return;

    if (message.content.startsWith("!ping")) {
        console.log("Ping command detected");
        if (
            message.channel instanceof TextChannel ||
            message.channel instanceof DMChannel ||
            message.channel instanceof NewsChannel
        ) {
            await message.channel.send("Pong!");
        } else {
            console.warn("Unsupported channel type for sending messages.");
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.login(process.env.TOKEN);
