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

export interface UserAttributes {
    id: number;
    discordId: string;
    username: string;
}

export interface AttendanceAttributes {
    id: number;
    userId: number;
    timestamp: Date;
    consecutiveDays: number;
    beforeSevenCount: number;
}
