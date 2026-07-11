import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { getOwnerByChannel } from "../ticketStore.js";

export const remove: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a user from this ticket")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to remove").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel;

    if (!(channel instanceof TextChannel)) {
      await interaction.reply({ content: "This is not a text channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    const owner = getOwnerByChannel(channel.id);
    if (!owner) {
      await interaction.reply({
        content: "This channel is not a ticket.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const target = interaction.options.getUser("user", true);

    await channel.permissionOverwrites.delete(target.id);

    await interaction.reply({
      content: `<@${target.id}> has been removed from this ticket.`,
    });
  },
};
