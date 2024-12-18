import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    SlashCommandBuilder,
    CommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("selectmenu")
    .setDescription("Replies with a select menu.");

export async function execute(interaction: CommandInteraction) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("starter")
        .setPlaceholder("Make a selection!")
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Bulbasaur")
                .setDescription("The dual-type Grass/Poison Seed Pokémon.")
                .setValue("bulbasaur"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Charmander")
                .setDescription("The Fire-type Lizard Pokémon.")
                .setValue("charmander"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Squirtle")
                .setDescription("The Water-type Tiny Turtle Pokémon.")
                .setValue("squirtle"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Pikachu")
                .setDescription("The Electric-type Mouse Pokémon.")
                .setValue("pikachu"),
            new StringSelectMenuOptionBuilder()
                .setLabel("Eevee")
                .setDescription("The Normal-type Evolution Pokémon.")
                .setValue("eevee")
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select
    );

    await interaction.reply({
        content: "Choose your starter!",
        components: [row],
    });
}
