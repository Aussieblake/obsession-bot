import { REST, Routes, type Client } from "discord.js";
import { commands } from "../client.js";
import { logger } from "../../lib/logger.js";

export async function onReady(client: Client<true>) {
  logger.info({ tag: client.user.tag }, "Discord bot logged in");

  const token = process.env["DISCORD_TOKEN"];
  if (!token) throw new Error("DISCORD_TOKEN is missing");

  const rest = new REST().setToken(token);
  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

  const guildId = process.env["DISCORD_GUILD_ID"];

  if (guildId) {
    // Guild-specific — registers instantly (great for development)
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
      body,
    });
    logger.info({ guildId, count: body.length }, "Slash commands registered (guild)");
  } else {
    // Global — may take up to 1 hour to propagate
    await rest.put(Routes.applicationCommands(client.user.id), { body });
    logger.info({ count: body.length }, "Slash commands registered (global)");
  }
}
