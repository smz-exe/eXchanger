import { SlashCommandBuilder, CommandInteraction, Guild } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("server")
        .setDescription("Provides information about the server."),
    async execute(interaction: CommandInteraction) {
        if (interaction.guild instanceof Guild) {
            await interaction.reply(
                `This server is ${interaction.guild.name}, and has ${interaction.guild.memberCount} members.`
            );
        } else {
            await interaction.reply(
                "This command was run outside of a server."
            );
        }
    },
};
