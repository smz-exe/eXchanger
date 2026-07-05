import { Collection } from "discord.js";
import type { Command } from "../types/commands.types";

declare module "discord.js" {
    interface Client {
        commands: Collection<string, Command>;
    }
}
