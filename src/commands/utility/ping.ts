import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
        "🏓 Check that the bot is responsive and view its latency."
    );

export async function execute(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const latency = Math.round(interaction.client.ws.ping);
    await interaction.reply({
        content: `🏓 Pong! WebSocket latency: **${latency}ms**.`,
        ephemeral: true,
    });
}
