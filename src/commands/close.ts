import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { getOwnerByChannel } from "../ticketStore.js";

export const close: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close this support ticket")
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Optional reason for closing")
        .setRequired(false),
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
        content: "This channel is not a ticket. Use this command inside an open ticket.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reason = interaction.options.getString("reason") ?? "No reason provided";

    const embed = new EmbedBuilder()
      .setTitle("Ticket Closing")
      .setDescription(
        `This ticket is being closed by <@${interaction.user.id}>.\n**Reason:** ${reason}\n\nChannel will be deleted in 5 seconds.`,
      )
      .setColor(0xed4245)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_cancel_close")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    setTimeout(async () => {
      try {
        await channel.delete(`Ticket closed by ${interaction.user.tag}: ${reason}`);
      } catch {
        // Channel may have already been deleted or bot lacks permission
      }
    }, 5000);
  },
};
