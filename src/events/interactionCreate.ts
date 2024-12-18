import {
    Interaction,
    CommandInteraction,
    Client,
    Collection,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
} from "discord.js";
import type { Command } from "../types/commands.types";

export const name = "interactionCreate";
export const once = false;

async function handleChatInputCommand(
    interaction: CommandInteraction,
    client: Client & { commands: Collection<string, Command> }
): Promise<void> {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `[ERROR] No matching command for: ${interaction.commandName}`
        );
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `[ERROR] Failed to execute command ${interaction.commandName}:`,
            error
        );

        const replyOptions = {
            content: "There was an error while executing this command!",
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
}

async function handleUserSelectMenu(
    interaction: UserSelectMenuInteraction
): Promise<void> {
    if (interaction.customId === "select_user") {
        const selectedUser = interaction.users.first();

        if (!selectedUser) {
            await interaction.reply({
                content: "❌ No user was selected. Please try again.",
                ephemeral: true,
            });
            return;
        }

        await interaction.reply({
            content: `✅ You selected **${selectedUser.username}**. Sending them a Hello message!`,
            ephemeral: true,
        });

        try {
            await selectedUser.send(`Hello, ${selectedUser.username}! 👋`);
        } catch (error) {
            console.error(
                `[ERROR] Failed to send DM to ${selectedUser.username}:`,
                error
            );
            await interaction.followUp({
                content: `⚠️ Failed to send a Hello message to **${selectedUser.username}**. They might have DMs disabled.`,
                ephemeral: true,
            });
        }
    }
}

async function handleSelectMenu(
    interaction: StringSelectMenuInteraction
): Promise<void> {
    if (interaction.customId === "starter") {
        const selectedValues = interaction.values;
        let response = "You selected:\n";

        for (const value of selectedValues) {
            switch (value) {
                case "bulbasaur":
                    response +=
                        "🌱 Bulbasaur - A great choice for grass lovers!\n";
                    break;
                case "charmander":
                    response += "🔥 Charmander - You love fiery challenges!\n";
                    break;
                case "squirtle":
                    response += "💧 Squirtle - Water battles await you!\n";
                    break;
                case "pikachu":
                    response += "⚡ Pikachu - The electric choice!\n";
                    break;
                case "eevee":
                    response += "✨ Eevee - So versatile and adorable!\n";
                    break;
                default:
                    response += `❓ Unknown selection: ${value}\n`;
            }
        }

        await interaction.reply({
            content: response,
            ephemeral: true,
        });
    }
}

export const execute = async (
    interaction: Interaction,
    client: Client & { commands: Collection<string, Command> }
): Promise<void> => {
    if (interaction.isChatInputCommand()) {
        await handleChatInputCommand(interaction as CommandInteraction, client);
        return;
    }

    if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction as StringSelectMenuInteraction);
        return;
    }

    if (interaction.isUserSelectMenu()) {
        await handleUserSelectMenu(interaction as UserSelectMenuInteraction);
        return;
    }

    console.warn(`[WARNING] Unhandled interaction type: ${interaction.type}`);
};
