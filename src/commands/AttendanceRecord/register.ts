import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your attendance in the system.");

export async function execute(interaction: CommandInteraction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    try {
        const [user, created] = await User.findOrCreate({
            where: { discordId },
            defaults: { username },
        });

        if (created) {
            await interaction.reply(
                `Successfully registered as ${interaction.user.displayName}.`
            );
        } else {
            await interaction.reply("You are already registered.");
        }
    } catch (error) {
        console.error("[ERROR] Failed to register user:", error);
        await interaction.reply("Failed to register. Please try again later.");
    }
}
