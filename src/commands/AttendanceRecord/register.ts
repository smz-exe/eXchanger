import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";
import User from "../../models/User";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("✅ Sign up to participate in the attendance system.");

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

        const embed = new EmbedBuilder()
            .setColor(created ? 0x00ff00 : 0x0099ff)
            .setTitle(
                created ? "Registration Successful 🎉" : "Already Registered"
            )
            .setDescription(
                created
                    ? `Welcome, **${displayName}**! \n You have successfully signed up as **${username}**.`
                    : `Hello again, **${displayName}**! \n You are already registered in the system.`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({
                text: created
                    ? "Thank you for joining the attendance system!"
                    : "Feel free to continue using the system!",
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("[ERROR] Failed to register user:", {
            discordId,
            username,
            error,
        });

        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Registration Failed ❌")
            .setDescription(
                "An error occurred while registering. Please try again later."
            )
            .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
