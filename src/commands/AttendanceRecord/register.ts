import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { userService } from "../../container";
import { errorEmbed } from "../../lib/embeds";
import { logger } from "../../lib/logger";
import { COLORS } from "../../lib/constants";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("✅ Sign up to participate in the attendance system.");

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const displayName = interaction.user.displayName ?? username;

    try {
        const { created } = await userService.register(discordId, username);

        const embed = new EmbedBuilder()
            .setColor(created ? COLORS.SUCCESS : COLORS.INFO)
            .setTitle(
                created ? "Registration Successful 🎉" : "Already Registered"
            )
            .setDescription(
                created
                    ? `Welcome, **${displayName}**! \n You have successfully signed up as **${username}**.`
                    : `Hello again, **${displayName}**! \n You are already registered in the system.`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({
                text: created
                    ? "Thank you for joining the attendance system!"
                    : "Feel free to continue using the system!",
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error("Failed to register user", { discordId, username, error });
        await interaction.reply({
            embeds: [
                errorEmbed(
                    "An error occurred while registering. Please try again later.",
                    "Registration Failed ❌"
                ),
            ],
            ephemeral: true,
        });
    }
}
