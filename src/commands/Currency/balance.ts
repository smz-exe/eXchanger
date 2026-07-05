import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { currencyService } from "../../container";
import { logger } from "../../lib/logger";

export const data = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 Check your current balance.");

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    try {
        const balance = await currencyService.getBalance(interaction.user.id);

        if (balance === null) {
            await interaction.reply({
                content:
                    "❌ You are not registered. Use `/register` to sign up!",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: `💰 Your current balance is **${balance} Jams**.`,
            ephemeral: true,
        });
    } catch (error) {
        logger.error("Failed to retrieve balance", error);
        await interaction.reply({
            content: "⚠️ An error occurred while retrieving your balance.",
            ephemeral: true,
        });
    }
}
