import { Client, Events, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user}`);
});

client.login(process.env.DISCORD_TOKEN);
