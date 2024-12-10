import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { differenceInDays } from "date-fns";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("Mark your attendance (before 9:00 AM).");

function isBeforeOrAtSeven(hour: number, minute: number): boolean {
    return hour < 7 || (hour === 7 && minute === 0);
}

function generateAttendanceMessage(
    displayName: string,
    timestamp: Date,
    consecutiveDays: number,
    beforeSevenCount: number
): string {
    let message = `Hello, ${displayName}! Your attendance has been recorded at ${timestamp.toLocaleTimeString()}.`;

    if (consecutiveDays > 1) {
        message += `\nThis is your ${consecutiveDays}-day streak! Keep it going!`;

        if (consecutiveDays % 10 === 0) {
            message += `\n🎉 Milestone reached: ${consecutiveDays} consecutive days! Congratulations!`;
        }
    }

    if (beforeSevenCount > 0) {
        message += `\nYou have marked attendance ${beforeSevenCount} times consecutively before or at 7:00 AM. Amazing dedication!`;
    }

    return message;
}

async function handleAttendance(
    userId: number,
    now: Date,
    lastAttendance: Attendance | null
): Promise<{ consecutiveDays: number; beforeSevenCount: number }> {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let consecutiveDays = 1;
    let beforeSevenCount = 0;

    if (lastAttendance) {
        const lastDate = new Date(lastAttendance.timestamp);
        const diffInDays = differenceInDays(now, lastDate);

        if (diffInDays === 1) {
            consecutiveDays = lastAttendance.consecutiveDays + 1;

            const lastHour = lastDate.getHours();
            const lastMinute = lastDate.getMinutes();

            if (
                isBeforeOrAtSeven(lastHour, lastMinute) &&
                isBeforeOrAtSeven(currentHour, currentMinute)
            ) {
                beforeSevenCount = lastAttendance.beforeSevenCount + 1;
            } else if (isBeforeOrAtSeven(currentHour, currentMinute)) {
                beforeSevenCount = 1;
            } else {
                beforeSevenCount = 0;
            }
        } else if (diffInDays > 1) {
            consecutiveDays = 1;
            beforeSevenCount = 0;
        }
    }

    return { consecutiveDays, beforeSevenCount };
}

export async function execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
        const now = new Date();

        if (now.getHours() >= 9) {
            await interaction.reply({
                content:
                    "Attendance can only be marked before 9:00 AM. Please try again tomorrow.",
                ephemeral: true,
            });
            return;
        }

        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply({
                content: `You are not registered. Please use /register to sign up first.`,
                ephemeral: true,
            });
            return;
        }

        const lastAttendance = await Attendance.findOne({
            where: { userId: user.id },
            order: [["timestamp", "DESC"]],
        });

        const { consecutiveDays, beforeSevenCount } = await handleAttendance(
            user.id,
            now,
            lastAttendance
        );

        await Attendance.create({
            userId: user.id,
            timestamp: now,
            consecutiveDays,
            beforeSevenCount,
        });

        const message = generateAttendanceMessage(
            displayName,
            now,
            consecutiveDays,
            beforeSevenCount
        );
        await interaction.reply(message);
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
