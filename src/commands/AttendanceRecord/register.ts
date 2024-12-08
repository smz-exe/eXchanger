import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Sign up to participate in the attendance system.");

export async function execute(interaction: CommandInteraction) {
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    const displayName =
        interaction.user?.displayName || interaction.user.username;

    try {
        const [user, created] = await User.findOrCreate({
            where: { discordId },
            defaults: { discordId, username },
        });

        if (created) {
            await interaction.reply(
                `Welcome, ${displayName}! Successfully registered as ${username}.`
            );
        } else {
            await interaction.reply(
                `Hello again, ${displayName}! You are already registered.`
            );
        }
    } catch (error) {
        console.error("[ERROR] Failed to register user:", {
            discordId,
            username,
            error,
        });

        await interaction.reply({
            content:
                "An error occurred while registering. Please try again later.",
            ephemeral: true,
        });
    }
}
