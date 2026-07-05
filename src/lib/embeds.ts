import { EmbedBuilder } from "discord.js";
import { COLORS } from "./constants";

/** A red error embed with a consistent title. */
export function errorEmbed(
    description: string,
    title = "Error ⚠️"
): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

/** A green success embed. */
export function successEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

/** A yellow informational/warning embed. */
export function warningEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}
