import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("Mark your attendance.");

export async function execute(interaction: CommandInteraction) {
    const discordId = interaction.user.id;

    try {
        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply(
                "You are not registered. Use /register first."
            );
            return;
        }

        await Attendance.create({
            userId: user.id,
            timestamp: new Date(),
        });

        await interaction.reply(
            `Hello, ${interaction.user.displayName}! Attendance marked successfully.`
        );
    } catch (error) {
        console.error("[ERROR] Failed to mark attendance:", error);
        await interaction.reply(
            "Failed to mark attendance. Please try again later."
        );
    }
}
