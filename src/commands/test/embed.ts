import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Replies with an embed message.");

export async function execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Test Embed")
        .setDescription("This is a test embed message.")
        .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setThumbnail(
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/160px-Apple_logo_black.svg.png"
        )
        .setImage(
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Apple_park_cupertino_2019.jpg/500px-Apple_park_cupertino_2019.jpg"
        )
        .addFields(
            {
                name: "Field 1",
                value: "Value 1",
                inline: true,
            },
            {
                name: "Field 2",
                value: "Value 3",
                inline: true,
            },
            {
                name: "Field 4",
                value: "Value 3",
                inline: true,
            },
            {
                name: "Field 4",
                value: "Value 4",
                inline: false,
            },
            {
                name: "Field 5",
                value: "Value 5",
                inline: true,
            },
            {
                name: "Field 6",
                value: "Value 6",
                inline: true,
            },
            {
                name: "Field 7",
                value: "Value 7",
                inline: true,
            }
        )
        .setFooter({
            text: "This is a test footer.",
            iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}
