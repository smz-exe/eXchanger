import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";
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
    I want you to act as a motivational coach.
    I will provide you with some information about someone's goals and challenges, and it will be your job to come up with strategies that can help this person achieve their goals.
    This could involve providing positive affirmations, giving helpful advice or suggesting activities they can do to reach their end goal.

    Here is the attendance data for a user named "${username}".
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
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("Not Registered ❌")
                .setDescription(
                    "You are not registered.\n Please use **/register** to sign up first."
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const attendanceRecords = await Attendance.findAll({
            where: { userId: user.id },
            order: [["timestamp", "DESC"]],
        });

        if (attendanceRecords.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle("No Attendance Records 📅")
                .setDescription(
                    "You have no attendance records yet. Use **/attend** to mark your first attendance!"
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
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

        const aiAnalysis = await generateAnalysis(
            displayName,
            totalRecords,
            currentStreak,
            maxStreak,
            maxBeforeSevenStreak,
            latestTimestamp
        );

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`Attendance Summary for ${displayName} 🎉`)
            .addFields(
                {
                    name: "📌 Latest Attendance",
                    value: latestTimestamp.toLocaleString(),
                    inline: false,
                },
                {
                    name: "🔥 Current Streak",
                    value: `${currentStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "🏆 Highest Streak",
                    value: `${maxStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "⏰ Streak Before 7:00",
                    value: `${maxBeforeSevenStreak} day(s)`,
                    inline: true,
                },
                {
                    name: "📊 Total Records",
                    value: `${totalRecords}`,
                    inline: true,
                },
                {
                    name: "💡 AI Analysis",
                    value: aiAnalysis,
                    inline: false,
                }
            )
            .setFooter({ text: "Gemini 1.5 Flash" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("[ERROR] Failed to retrieve attendance records:", {
            discordId,
            error,
        });

        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error ⚠️")
            .setDescription(
                "An error occurred while retrieving your attendance records. Please try again later."
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
