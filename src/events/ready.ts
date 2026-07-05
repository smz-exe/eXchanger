import { Client, ActivityType } from "discord.js";
import { logger } from "../lib/logger";

export const name = "clientReady";
export const once = true;

export const execute = async (client: Client): Promise<void> => {
    if (client.user) {
        client.user.setActivity("Just Do It ☑️", {
            type: ActivityType.Custom,
        });
        logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
    } else {
        logger.error("Client user is null.");
    }
};
