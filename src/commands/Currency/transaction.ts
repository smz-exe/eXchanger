import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";
import Transaction from "../../models/Transaction";
import User from "../../models/User";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("transactions")
    .setDescription("📜 View your transaction history.");

export async function execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.user.id;

    try {
        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply({
                content:
                    "❌ You are not registered in the system. Please use `/register` to sign up first.",
                ephemeral: true,
            });
            return;
        }

        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { userId: user.id },
                    { senderId: user.id },
                    { recipientId: user.id },
                ],
            },
            order: [["createdAt", "DESC"]],
        });

        if (transactions.length === 0) {
            await interaction.reply({
                content: "📭 You have no transactions yet.",
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("💰 Your Transaction History")
            .setDescription("Here are your recent transactions:")
            .setFooter({
                text: "Jam System",
                iconURL: interaction.client.user?.avatarURL() || undefined,
            })
            .setTimestamp();

        transactions.slice(0, 10).forEach((transaction) => {
            const isSender = transaction.senderId === user.id;
            const type = isSender ? "Sent" : "Received";
            const amount = transaction.amount;
            const otherPartyId = isSender
                ? transaction.recipientId
                : transaction.senderId;
            const reason = transaction.reason || "No reason provided.";

            embed.addFields({
                name: `${type} ${amount} Jam`,
                value: `**With User ID:** ${otherPartyId}\n**Reason:** ${reason}\n**Date:** ${transaction.createdAt.toLocaleString()}`,
                inline: false,
            });
        });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("[ERROR] Failed to retrieve transactions:", error);
        await interaction.reply({
            content:
                "⚠️ An error occurred while retrieving your transaction history. Please try again later.",
            ephemeral: true,
        });
    }
}
