import {
    Interaction,
    CommandInteraction,
    Client,
    Collection,
} from "discord.js";
import type { Command } from "../types";

export const name = "interactionCreate";
export const once = false;

export const execute = async (
    interaction: Interaction,
    client: Client & { commands: Collection<string, Command> }
): Promise<void> => {
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
};
