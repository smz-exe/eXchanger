import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { differenceInCalendarDays, isSameDay } from "date-fns";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("➡️ Mark your attendance (between 5:00 AM and 9:00 AM).");

function isBeforeOrAtSeven(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return hour < 7 || (hour === 7 && minute === 0);
}

function isWithinAttendancePeriod(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 5 && hour < 9;
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
        if (!isWithinAttendancePeriod(now)) {
            const embed = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle("Attendance Closed ⏰")
                .setDescription(
                    "Attendance can only be marked between 5:00 AM and 9:00 AM.\n Please try again during this time period."
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Not Registered ❌")
                .setDescription(
                    "You are not registered.\n Please use `/register` to sign up first."
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
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
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Already Checked In")
                .setDescription(
                    "You have already marked your attendance for today.\n See you tomorrow!"
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
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

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Attendance Recorded ✅")
            .setDescription(
                `Hello, **${displayName}**! Your attendance has been recorded at **${now.toLocaleTimeString()}**.`
            )
            .addFields(
                {
                    name: "Current Streak 🎯",
                    value: `${consecutiveDays} day(s)`,
                    inline: true,
                },
                {
                    name: "Before 7:00 AM 🌞",
                    value: `${beforeSevenCount} day(s)`,
                    inline: true,
                }
            )
            .setTimestamp();

        if (consecutiveDays % 7 === 0 || beforeSevenCount % 7 === 0) {
            embed.addFields({
                name: "Milestone 🎉",
                value: `Amazing! You've reached a milestone with your attendance streak!`,
            });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("[ERROR] Failed to mark attendance:", {
            discordId,
            username: interaction.user.username,
            timestamp: new Date(),
            error,
        });

        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Attendance Failed ❌")
            .setDescription(
                "An error occurred while marking your attendance. Please try again later."
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
