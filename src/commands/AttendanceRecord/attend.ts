import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { differenceInDays } from "date-fns";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("Mark your attendance (before 9:00 AM).");

export async function execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour >= 9) {
            await interaction.reply({
                content:
                    "Attendance can only be marked before 9:00 AM. Please try again tomorrow.",
                ephemeral: true,
            });
            return;
        }

        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply(
                `You are not registered. Please use /register to sign up first.`
            );
            return;
        }

        const lastAttendance = await Attendance.findOne({
            where: { userId: user.id },
            order: [["timestamp", "DESC"]],
        });

        const timestamp = now;
        let consecutiveDays = 1;

        if (lastAttendance) {
            const lastDate = new Date(lastAttendance.timestamp);

            const diffInDays = differenceInDays(timestamp, lastDate);

            if (diffInDays === 1) {
                consecutiveDays = lastAttendance.consecutiveDays + 1;
            } else if (diffInDays > 1) {
                consecutiveDays = 1;
            }
        }

        await Attendance.create({
            userId: user.id,
            timestamp,
            consecutiveDays,
        });

        let Message = `Hello, ${displayName}! Your attendance has been recorded at ${timestamp.toLocaleTimeString()}.`;

        if (consecutiveDays > 1) {
            Message += `\n This is your ${consecutiveDays}-day streak! Keep it going!`;

            if (consecutiveDays % 10 === 0) {
                Message += `\n 🎉 Milestone reached: ${consecutiveDays} consecutive days! Congratulations!`;
            }
        }

        await interaction.reply(Message);
    } catch (error) {
        console.error("[ERROR] Failed to mark attendance:", {
            discordId,
            error,
        });
        await interaction.reply({
            content:
                "An error occurred while marking your attendance. Please try again later.",
            ephemeral: true,
        });
    }
}
