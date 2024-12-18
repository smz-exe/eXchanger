import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    PermissionsBitField,
    CommandInteractionOptionResolver,
} from "discord.js";
import User from "../../models/User";
import Currency from "../../models/Currency";
import Transaction from "../../models/Transaction";
import dotenv from "dotenv";

dotenv.config();

export const data = new SlashCommandBuilder()
    .setName("addjam")
    .setDescription("Add Jam to a user's balance.")
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user to whom Jam will be added.")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("The amount of Jam to add.")
            .setRequired(true)
            .setMinValue(1)
    );

async function fetchUserByDiscordId(discordId: string): Promise<User | null> {
    return await User.findOne({ where: { discordId } });
}

async function ensureCurrencyEntry(userId: number): Promise<Currency> {
    const [currency] = await Currency.findOrCreate({
        where: { userId },
        defaults: { userId, balance: 0 },
    });
    return currency;
}

export async function execute(interaction: CommandInteraction): Promise<void> {
    const targetUser = (
        interaction.options as CommandInteractionOptionResolver
    ).getUser("user", true);
    const amount = (
        interaction.options as CommandInteractionOptionResolver
    ).getInteger("amount", true);

    if (
        !interaction.memberPermissions?.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {
        await interaction.reply({
            content: "❌ You do not have permission to use this command.",
            ephemeral: true,
        });
        return;
    }

    try {
        const botId = process.env.CLIENT_ID;
        if (!botId) {
            throw new Error(
                "Bot ID (CLIENT_ID) is not defined in environment variables."
            );
        }

        const systemUser = await fetchUserByDiscordId(botId);
        if (!systemUser) {
            throw new Error(
                "The system user is not registered in the database. Please ensure the bot is registered during initialization."
            );
        }

        const recipient = await fetchUserByDiscordId(targetUser.id);
        if (!recipient) {
            await interaction.reply({
                content: `❌ The user ${targetUser.username} is not registered in the system.`,
                ephemeral: true,
            });
            return;
        }

        const currency = await ensureCurrencyEntry(recipient.id);
        const newBalance = currency.balance + amount;

        await currency.update({ balance: newBalance });

        await Transaction.create({
            userId: systemUser.id,
            senderId: systemUser.id,
            recipientId: recipient.id,
            type: "earn",
            amount,
            reason: "Admin granted Jam.",
        });

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Jam Added Successfully")
            .setDescription(
                `🎉 **${amount} Jam** has been added to ${targetUser.username}'s balance by the system.`
            )
            .addFields(
                {
                    name: "Recipient",
                    value: `<@${targetUser.id}>`,
                    inline: true,
                },
                { name: "Sender", value: "System (Bot)", inline: true },
                {
                    name: "New Balance",
                    value: `${newBalance} Jam`,
                    inline: true,
                }
            )
            .setTimestamp()
            .setFooter({
                text: "Jam System",
                iconURL: interaction.client.user?.avatarURL() || undefined,
            });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("[ERROR] Failed to execute /addjam command:", error);
        await interaction.reply({
            content:
                "⚠️ An error occurred while adding Jam. Please try again later.",
            ephemeral: true,
        });
    }
}
