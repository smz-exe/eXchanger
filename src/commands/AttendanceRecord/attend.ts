import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { attendanceService } from "../../container";
import { errorEmbed } from "../../lib/embeds";
import { logger } from "../../lib/logger";
import { COLORS } from "../../lib/constants";
import type { AttendanceResult } from "../../services/AttendanceService";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("➡️ Mark your attendance (between 5:00 AM and 9:00 AM).");

function renderResult(
    result: AttendanceResult,
    displayName: string
): EmbedBuilder {
    switch (result.status) {
        case "closed":
            return new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setTitle("Attendance Closed ⏰")
                .setDescription(
                    "Attendance can only be marked between 5:00 AM and 9:00 AM.\n Please try again during this time period."
                )
                .setTimestamp();
        case "not_registered":
            return new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle("Not Registered ❌")
                .setDescription(
                    "You are not registered.\n Please use `/register` to sign up first."
                )
                .setTimestamp();
        case "already_checked_in":
            return new EmbedBuilder()
                .setColor(COLORS.INFO)
                .setTitle("Already Checked In")
                .setDescription(
                    "You have already marked your attendance for today.\n See you tomorrow!"
                )
                .setTimestamp();
        case "recorded": {
            const embed = new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setTitle("Attendance Recorded ✅")
                .setDescription(
                    `Hello, **${displayName}**! Your attendance has been recorded at **${result.at.toLocaleTimeString()}**.`
                )
                .addFields(
                    {
                        name: "Current Streak 🎯",
                        value: `${result.consecutiveDays} day(s)`,
                        inline: true,
                    },
                    {
                        name: "Before 7:00 AM 🌞",
                        value: `${result.beforeSevenCount} day(s)`,
                        inline: true,
                    }
                )
                .setTimestamp();

            if (result.milestone) {
                embed.addFields({
                    name: "Milestone 🎉",
                    value: "Amazing! You've reached a milestone with your attendance streak!",
                });
            }
            return embed;
        }
    }
}

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user.displayName ?? interaction.user.username;

    try {
        const result = await attendanceService.checkIn(discordId, new Date());
        const embed = renderResult(result, displayName);
        const ephemeral = result.status !== "recorded";
        await interaction.reply({ embeds: [embed], ephemeral });
    } catch (error) {
        logger.error("Failed to mark attendance", {
            discordId,
            username: interaction.user.username,
            error,
        });
        await interaction.reply({
            embeds: [
                errorEmbed(
                    "An error occurred while marking your attendance. Please try again later.",
                    "Attendance Failed ❌"
                ),
            ],
            ephemeral: true,
        });
    }
}
