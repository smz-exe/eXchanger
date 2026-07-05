import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { attendanceService, geminiService } from "../../container";
import { warningEmbed, errorEmbed } from "../../lib/embeds";
import { logger } from "../../lib/logger";
import { COLORS, GEMINI_MODEL } from "../../lib/constants";

export const data = new SlashCommandBuilder()
    .setName("record")
    .setDescription(
        "📊 View your attendance records, milestones, and analysis."
    );

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user.displayName ?? interaction.user.username;

    // The AI call can take longer than Discord's 3s reply window, so defer.
    await interaction.deferReply();

    try {
        const stats = await attendanceService.getStats(discordId);

        if (stats === null) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        "You are not registered.\n Please use **/register** to sign up first.",
                        "Not Registered ❌"
                    ),
                ],
            });
            return;
        }

        if (stats.status === "no_records") {
            await interaction.editReply({
                embeds: [
                    warningEmbed(
                        "No Attendance Records 📅",
                        "You have no attendance records yet. Use **/attend** to mark your first attendance!"
                    ),
                ],
            });
            return;
        }

        const aiAnalysis = await geminiService.analyzeAttendance({
            username: displayName,
            totalRecords: stats.totalRecords,
            currentStreak: stats.currentStreak,
            maxStreak: stats.maxStreak,
            maxBeforeSevenStreak: stats.maxBeforeSevenStreak,
            latestAttendance: stats.latestAttendance,
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(`Attendance Summary for ${displayName} 🎉`)
            .addFields(
                {
                    name: "📌 Latest Attendance",
                    value: stats.latestAttendance.toLocaleString(),
                    inline: false,
                },
                {
                    name: "🔥 Current Streak",
                    value: `${stats.currentStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "🏆 Highest Streak",
                    value: `${stats.maxStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "⏰ Streak Before 7:00",
                    value: `${stats.maxBeforeSevenStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "📊 Total Records",
                    value: `${stats.totalRecords}`,
                    inline: true,
                },
                {
                    name: "💡 AI Analysis",
                    value: aiAnalysis,
                    inline: false,
                }
            )
            .setFooter({ text: GEMINI_MODEL })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error("Failed to retrieve attendance records", {
            discordId,
            error,
        });
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    "An error occurred while retrieving your attendance records. Please try again later."
                ),
            ],
        });
    }
}
