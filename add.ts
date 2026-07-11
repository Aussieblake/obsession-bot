import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { getOwnerByChannel } from "../ticketStore.js";

export const add: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a user to this ticket")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to add").setRequired(true),
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

    await channel.permissionOverwrites.create(target.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    await interaction.reply({
      content: `<@${target.id}> has been added to this ticket.`,
    });
  },
};
