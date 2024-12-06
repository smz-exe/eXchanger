import {
    SlashCommandSubcommandBuilder,
    CommandInteraction,
    GuildMember,
} from "discord.js";

export default {
    data: new SlashCommandSubcommandBuilder()
        .setName("user")
        .setDescription("Provides information about a user."),
    async execute(interaction: CommandInteraction) {
        if (interaction.member instanceof GuildMember) {
            await interaction.reply(
                `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`
            );
        } else {
            await interaction.reply(
                `This command was run by ${interaction.user.username}, but we couldn't retrieve the join date.`
            );
        }
    },
};
