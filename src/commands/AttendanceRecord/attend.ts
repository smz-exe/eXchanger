import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { differenceInCalendarDays, isSameDay } from "date-fns";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("Mark your attendance (before 9:00 AM).");

function isBeforeOrAtSeven(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
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

        if (consecutiveDays % 7 === 0) {
            message += `\n🎉 Milestone reached: ${consecutiveDays} consecutive days! Congratulations! 🎉`;
        }
    }

    if (beforeSevenCount > 0) {
        message += `\nYou have marked attendance ${beforeSevenCount} times consecutively before or at 7:00 AM.\n Amazing dedication! 🌞`;

        if (beforeSevenCount % 7 === 0) {
            message += `\n🎉 Milestone reached: ${beforeSevenCount} consecutive days marked before or at 7:00 AM! Congratulations! 🎉`;
        }
    }

    return message;
}

async function handleAttendance(
    userId: number,
    now: Date,
    lastAttendance: Attendance | null
): Promise<{ consecutiveDays: number; beforeSevenCount: number }> {
    let consecutiveDays = 1;
    let beforeSevenCount = isBeforeOrAtSeven(now) ? 1 : 0;

    if (lastAttendance) {
        const lastDate = new Date(lastAttendance.timestamp);

        if (differenceInCalendarDays(now, lastDate) === 1) {
            consecutiveDays = lastAttendance.consecutiveDays + 1;
            if (isBeforeOrAtSeven(lastDate) && isBeforeOrAtSeven(now)) {
                beforeSevenCount = lastAttendance.beforeSevenCount + 1;
            } else {
                beforeSevenCount = isBeforeOrAtSeven(now) ? 1 : 0;
            }
        }
    }

    return { consecutiveDays, beforeSevenCount };
}

export async function execute(
    interaction: CommandInteraction,
    now: Date = new Date()
): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
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

        if (
            lastAttendance &&
            isSameDay(new Date(lastAttendance.timestamp), now)
        ) {
            await interaction.reply({
                content:
                    "You have already marked your attendance for today. See you tomorrow!",
                ephemeral: true,
            });
            return;
        }

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
            username: interaction.user.username,
            timestamp: new Date(),
            error,
        });
        await interaction.reply({
            content:
                "An error occurred while marking your attendance. Please try again later.",
            ephemeral: true,
        });
    }
}
