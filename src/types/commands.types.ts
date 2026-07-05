import type {
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

/** Anything with a `toJSON()` producing a slash-command body (e.g. SlashCommandBuilder). */
export interface CommandData {
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export interface Command {
    data: CommandData;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
