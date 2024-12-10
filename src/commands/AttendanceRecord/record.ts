import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY is not defined in the environment variables."
    );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const DISCORD_MAX_MESSAGE_LENGTH = 2000;

export const data = new SlashCommandBuilder()
    .setName("record")
    .setDescription(
        "📊 View your attendance records, milestones, and analysis."
    );

async function generateAnalysis(
    username: string,
    totalRecords: number,
    currentStreak: number,
    maxStreak: number,
    maxBeforeSevenStreak: number,
    latestAttendance: Date
): Promise<string> {
    const prompt = `
    Analyze the attendance data for a user named "${username}".
    The user has the following data:
    - Total attendance records: ${totalRecords}
    - Current streak: ${currentStreak} days
    - Maximum streak: ${maxStreak} days
    - Maximum streak before 7:00 AM: ${maxBeforeSevenStreak} days
    - Latest attendance: ${latestAttendance.toLocaleString()}

    Provide an insightful analysis of the user's performance and suggest personalized motivational advice to encourage further progress.
    Make it supportive and engaging.
    Make it less than 100 words.
    `;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text() || "🌟 Keep shining! You're doing great!";
    } catch (error) {
        console.error(
            "An error occurred while generating AI analysis and motivation:",
            error
        );
        return "🌟 Keep shining! You're doing great!";
    }
}

export async function execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply({
                content: `❌ You are not registered. Please use **/register** to sign up first.`,
                ephemeral: true,
            });
            return;
        }

        const attendanceRecords = await Attendance.findAll({
            where: { userId: user.id },
            order: [["timestamp", "DESC"]],
        });

        if (attendanceRecords.length === 0) {
            await interaction.reply({
                content: `📅 You have no attendance records yet. Use **/attend** to mark your first attendance!`,
                ephemeral: true,
            });
            return;
        }

        const latestRecord = attendanceRecords[0];
        const latestTimestamp = new Date(latestRecord.timestamp);

        const currentStreak = latestRecord.consecutiveDays;
        const maxStreak = Math.max(
            ...attendanceRecords.map((record) => record.consecutiveDays)
        );

        const maxBeforeSevenStreak = Math.max(
            ...attendanceRecords.map((record) => record.beforeSevenCount)
        );

        const totalRecords = attendanceRecords.length;

        let message = `🎉 **Hello, ${displayName}! Here's your attendance summary:** 🎉\n\n`;
        message += `📌 **Latest Attendance:** ${latestTimestamp.toLocaleString()}\n`;
        message += `🔥 **Current Streak:** ${currentStreak} day(s)\n`;
        message += `🏆 **Highest Streak:** ${maxStreak} day(s)\n`;
        message += `⏰ **Highest Streak Before 7:00:** ${maxBeforeSevenStreak} day(s)\n`;
        message += `📊 **Total Records:** ${totalRecords}\n`;

        const aiAnalysis = await generateAnalysis(
            displayName,
            totalRecords,
            currentStreak,
            maxStreak,
            maxBeforeSevenStreak,
            latestTimestamp
        );

        message += `\n💡 **Analysis:**\n ${aiAnalysis}`;

        if (message.length > DISCORD_MAX_MESSAGE_LENGTH) {
            console.warn(
                "[WARNING] Message exceeds Discord's limit. Trimming..."
            );
            message = `${message.slice(
                0,
                DISCORD_MAX_MESSAGE_LENGTH - 100
            )}\n\n✂️ [Message truncated due to length.]`;
        }

        await interaction.reply(message);
    } catch (error) {
        console.error("[ERROR] Failed to retrieve attendance records:", {
            discordId,
            error,
        });
        await interaction.reply({
            content:
                "⚠️ An error occurred while retrieving your attendance records. Please try again later.",
            ephemeral: true,
        });
    }
}
