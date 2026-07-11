import { client, commands } from "./client.js";
import { setup } from "./commands/setup.js";
import { close } from "./commands/close.js";
import { add } from "./commands/add.js";
import { remove } from "./commands/remove.js";
import { modapp } from "./commands/modapp.js";
import { setmodapp } from "./commands/setmodapp.js";
import { setupmodapp } from "./commands/setupmodapp.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { logger } from "../lib/logger.js";

// Register all commands
commands.set(setup.data.name, setup);
commands.set(close.data.name, close);
commands.set(add.data.name, add);
commands.set(remove.data.name, remove);
commands.set(modapp.data.name, modapp);
commands.set(setmodapp.data.name, setmodapp);
commands.set(setupmodapp.data.name, setupmodapp);

// Attach event handlers
client.once("ready", (c) => {
  onReady(c).catch((err) => logger.error({ err }, "Error in ready handler"));
});

client.on("interactionCreate", (interaction) => {
  onInteractionCreate(interaction).catch((err) =>
    logger.error({ err }, "Error in interactionCreate handler"),
  );
});

export function startBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start");
    return;
  }

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
    process.exit(1);
  });
}
