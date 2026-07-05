import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsBitField,
} from "discord.js";
import { currencyService } from "../../container";
import { env } from "../../config/env";
import { errorEmbed } from "../../lib/embeds";
import { isAppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { COLORS } from "../../lib/constants";

export const data = new SlashCommandBuilder()
    .setName("addjam")
    .setDescription("Add Jam to a user's balance.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to whom Jam will be added.")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount of Jam to add.")
            .setRequired(true)
            .setMinValue(1)
    );

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    if (
        !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            ephemeral: true,
        });
        return;
    }

    const targetUser = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    try {
        const result = await currencyService.addJam(
            env.CLIENT_ID,
            targetUser.id,
            amount
        );

        if (result.status === "recipient_not_registered") {
            await interaction.reply({
                content: `❌ The user ${targetUser.username} is not registered in the system.`,
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle("Jam Added Successfully")
            .setDescription(
                `🎉 **${amount} Jam** has been added to ${targetUser.username}'s balance by the system.`
            )
            .addFields(
                {
                    name: "Recipient",
                    value: `<@${targetUser.id}>`,
                    inline: true,
                },
                { name: "Sender", value: "System (Bot)", inline: true },
                {
                    name: "New Balance",
                    value: `${result.newBalance} Jam`,
                    inline: true,
                }
            )
            .setTimestamp()
            .setFooter({
                text: "Jam System",
                iconURL: interaction.client.user?.avatarURL() ?? undefined,
            });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error("Failed to execute /addjam command", error);
        const message = isAppError(error)
            ? error.userMessage
            : "⚠️ An error occurred while adding Jam. Please try again later.";
        await interaction.reply({
            embeds: [errorEmbed(message)],
            ephemeral: true,
        });
    }
}
