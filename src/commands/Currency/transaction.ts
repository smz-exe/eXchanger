import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { currencyService, repositories } from "../../container";
import { errorEmbed } from "../../lib/embeds";
import { logger } from "../../lib/logger";
import { COLORS, TRANSACTION_HISTORY_LIMIT } from "../../lib/constants";

export const data = new SlashCommandBuilder()
    .setName("transactions")
    .setDescription("📜 View your transaction history.");

/** Resolve an internal user id to a Discord mention, cached per invocation. */
async function mentionFor(
    userId: number | null,
    cache: Map<number, string>
): Promise<string> {
    if (userId === null) return "Unknown";
    const cached = cache.get(userId);
    if (cached) return cached;

    const user = await repositories.users.findById(userId);
    const label = user ? `<@${user.discordId}>` : `User #${userId}`;
    cache.set(userId, label);
    return label;
}

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    try {
        const history = await currencyService.getHistory(
            interaction.user.id,
            TRANSACTION_HISTORY_LIMIT
        );

        if (history === null) {
            await interaction.reply({
                content:
                    "❌ You are not registered in the system. Please use `/register` to sign up first.",
                ephemeral: true,
            });
            return;
        }

        if (history.transactions.length === 0) {
            await interaction.reply({
                content: "📭 You have no transactions yet.",
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle("💰 Your Transaction History")
            .setDescription("Here are your recent transactions:")
            .setFooter({
                text: "Jam System",
                iconURL: interaction.client.user?.avatarURL() ?? undefined,
            })
            .setTimestamp();

        const cache = new Map<number, string>();
        for (const tx of history.transactions) {
            const isSender = tx.senderId === history.userId;
            const type = isSender ? "Sent" : "Received";
            const otherParty = isSender ? tx.recipientId : tx.senderId;
            const mention = await mentionFor(otherParty, cache);
            const reason = tx.reason ?? "No reason provided.";

            embed.addFields({
                name: `${type} ${tx.amount} Jam`,
                value: `**With:** ${mention}\n**Reason:** ${reason}\n**Date:** ${tx.createdAt.toLocaleString()}`,
                inline: false,
            });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error("Failed to retrieve transactions", error);
        await interaction.reply({
            embeds: [
                errorEmbed(
                    "An error occurred while retrieving your transaction history. Please try again later."
                ),
            ],
            ephemeral: true,
        });
    }
}
