import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import type { SlashCommand } from "./types.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,        // required for awaitMessages in DMs
    GatewayIntentBits.DirectMessageReactions, // good practice alongside DMs
  ],
  partials: [
    Partials.Channel, // required so uncached DM channels are created
    Partials.Message, // required so DM message events fire reliably
  ],
});

export const commands = new Collection<string, SlashCommand>();
