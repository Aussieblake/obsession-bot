import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { setAppChannel } from "../applicationStore.js";

export const setmodapp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setmodapp")
    .setDescription("Set the channel where mod applications are posted")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("The channel to receive mod applications")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: "This command must be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);
    if (!(channel instanceof TextChannel)) {
      await interaction.reply({ content: "Please select a text channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    setAppChannel(guild.id, channel.id);

    await interaction.reply({
      content: `Mod applications will now be posted in <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
