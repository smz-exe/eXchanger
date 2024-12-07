import type { CommandInteraction } from "discord.js";

export interface CommandData {
    toJSON: () => {
        name: string;
        description: string;
    };
}

export interface Command {
    data: CommandData;
    execute: (interaction: CommandInteraction) => Promise<void>;
}
