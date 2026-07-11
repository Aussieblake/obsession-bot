import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel,
  Colors,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";

export const setupmodapp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setupmodapp")
    .setDescription("Post the moderator application panel in this channel")
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
      .setTitle("📋 Moderator Applications — Obsession")
      .setDescription(
        "Are you interested in joining the Obsession staff team?\n\n" +
          "Click the button below to start your moderator application. " +
          "The bot will DM you **9 questions** one at a time — answer each one " +
          "thoughtfully and honestly.\n\n" +
          "**Requirements:**\n" +
          "• Be respectful and mature\n" +
          "• Be active in the server\n" +
          "• Have a good understanding of the rules\n\n" +
          "⚠️ Asking about your application status after submitting **may result in denial**.",
      )
      .setColor(Colors.Blurple)
      .setFooter({ text: "Obsession Staff Team" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("modapp_start")
        .setLabel("Apply for Moderator")
        .setEmoji("📋")
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: "Moderator application panel posted successfully.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
