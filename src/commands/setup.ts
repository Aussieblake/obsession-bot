import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";

export const setup: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Post the ticket panel in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!(interaction.channel instanceof TextChannel)) {
      await interaction.reply({
        content: "This command can only be used in a text channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support Tickets")
      .setDescription(
        "Need help? Click the button below to open a private support ticket.\n\nOur team will be with you as soon as possible.",
      )
      .setColor(0x5865f2)
      .setFooter({ text: "One ticket per user • Be respectful" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel("Open a Ticket")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: "Ticket panel posted successfully.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
