import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import Currency from "../../models/Currency";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 Check your current balance.");

export async function execute(interaction: CommandInteraction) {
    try {
        const discordId = interaction.user.id;

        const user = await User.findOne({ where: { discordId } });
        if (!user) {
            await interaction.reply({
                content:
                    "❌ You are not registered. Use `/register` to sign up!",
                ephemeral: true,
            });
            return;
        }

        const currency = await Currency.findOne({ where: { userId: user.id } });
        const balance = currency ? currency.balance : 0;

        await interaction.reply({
            content: `💰 Your current balance is **${balance} Jams**.`,
            ephemeral: true,
        });
    } catch (error) {
        console.error("[ERROR] Failed to retrieve balance:", error);
        await interaction.reply({
            content: "⚠️ An error occurred while retrieving your balance.",
            ephemeral: true,
        });
    }
}
