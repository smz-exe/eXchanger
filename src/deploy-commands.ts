import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();
const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID!;

interface Command {
    data: { toJSON: () => object };
    execute: Function;
}

const commands: object[] = [];

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

        if (command.data && command.execute) {
            commands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

const rest = new REST({ version: "10" }).setToken(token);

Routes.applicationGuildCommands(clientId, guildId),
    (async () => {
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
            console.error(error);
        }
    })();
