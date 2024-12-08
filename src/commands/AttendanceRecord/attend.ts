import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import Attendance from "../../models/Attendance";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("Mark your attendance for today.");

export async function execute(interaction: CommandInteraction): Promise<void> {
    const discordId = interaction.user.id;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
        const user = await User.findOne({ where: { discordId } });

        if (!user) {
            await interaction.reply(
                `You are not registered. Please use /register to sign up first.`
            );
            return;
        }

        const timestamp = new Date();
        await Attendance.create({
            userId: user.id,
            timestamp,
        });

        await interaction.reply(
            `Hello, ${displayName}! Your attendance has been recorded at ${timestamp.toLocaleTimeString()}.`
        );
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
