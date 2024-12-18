import { Client, ActivityType } from "discord.js";

export const name = "ready";
export const once = true;

export const execute = async (client: Client) => {
    if (client.user) {
        client.user.setActivity("Just Do It ☑️", {
            type: ActivityType.Custom,
        });
        console.log(`[INFO] Bot is ready! Logged in as ${client.user.tag}`);
    } else {
        console.error("[ERROR] Client user is null.");
    }
};
