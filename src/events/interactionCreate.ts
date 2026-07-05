import { Interaction } from "discord.js";
import { logger } from "../lib/logger";

export const name = "interactionCreate";
export const once = false;

export const execute = async (interaction: Interaction): Promise<void> => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        logger.error(`No matching command for: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error(
            `Failed to execute command ${interaction.commandName}`,
            error
        );

        const payload = {
            content: "There was an error while executing this command!",
            ephemeral: true,
        };

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(payload);
            } else {
                await interaction.reply(payload);
            }
        } catch (replyError) {
            logger.error("Failed to send command error response", replyError);
        }
    }
};
