import {
    ActionRowBuilder,
    UserSelectMenuBuilder,
    SlashCommandBuilder,
    CommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("selectuser")
    .setDescription("Select a user and send them a Hello message.");

export async function execute(interaction: CommandInteraction) {
    try {
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId("select_user")
            .setPlaceholder("Select a user!");

        const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
            userSelect
        );

        if (!interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        await interaction.editReply({
            content: "Please select a user from the menu below:",
            components: [row],
        });
    } catch (error) {
        console.error(`[ERROR] Failed to execute selectuser command:`, error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true,
            });
        }
    }
}
