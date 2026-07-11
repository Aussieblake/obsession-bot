import {
  type Interaction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  CategoryChannel,
  MessageFlags,
  type InteractionReplyOptions,
} from "discord.js";
import { commands } from "../client.js";
import {
  hasOpenTicket,
  registerTicket,
  removeTicket,
  getTicketChannel,
  getOwnerByChannel,
} from "../ticketStore.js";
import { isApplying } from "../applicationStore.js";
import { runModappFlow } from "../commands/modappFlow.js";
import { logger } from "../../lib/logger.js";

const TICKET_CATEGORY_NAME = "Tickets";

async function getOrCreateCategory(guild: NonNullable<ButtonInteraction["guild"]>): Promise<CategoryChannel> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === TICKET_CATEGORY_NAME,
  );
  if (existing && existing instanceof CategoryChannel) return existing;

  return guild.channels.create({
    name: TICKET_CATEGORY_NAME,
    type: ChannelType.GuildCategory,
  });
}

async function handleTicketCreate(interaction: ButtonInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("This button can only be used in a server.");
    return;
  }

  const userId = interaction.user.id;

  if (hasOpenTicket(userId)) {
    const channelId = getTicketChannel(userId)!;
    await interaction.editReply(
      `You already have an open ticket: <#${channelId}>. Please use that channel.`,
    );
    return;
  }

  const category = await getOrCreateCategory(guild);
  const ticketName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  const channel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ],
  });

  registerTicket(userId, channel.id);

  const welcomeEmbed = new EmbedBuilder()
    .setTitle("Support Ticket Opened")
    .setDescription(
      `Hello <@${userId}>, thanks for reaching out!\n\nPlease describe your issue in detail and a staff member will assist you shortly.\n\nTo close this ticket, click the button below or use \`/close\`.`,
    )
    .setColor(0x57f287)
    .setTimestamp()
    .setFooter({ text: `Ticket owner: ${interaction.user.tag}` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `<@${userId}>`,
    embeds: [welcomeEmbed],
    components: [row],
  });

  await interaction.editReply(`Your ticket has been created: <#${channel.id}>`);
}

async function handleTicketClose(interaction: ButtonInteraction) {
  const channel = interaction.channel;

  if (!(channel instanceof TextChannel)) {
    await interaction.reply({ content: "This is not a text channel.", flags: MessageFlags.Ephemeral });
    return;
  }

  const owner = getOwnerByChannel(channel.id);
  if (!owner) {
    await interaction.reply({
      content: "This channel is not an active ticket.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Closing Ticket")
    .setDescription(
      `Ticket closed by <@${interaction.user.id}>.\nChannel will be deleted in 5 seconds.`,
    )
    .setColor(0xed4245)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  removeTicket(owner);

  setTimeout(async () => {
    try {
      await channel.delete(`Ticket closed by ${interaction.user.tag}`);
    } catch {
      // Channel may already be gone
    }
  }, 5000);
}

async function handleCancelClose(interaction: ButtonInteraction) {
  await interaction.message.delete().catch(() => null);
  await interaction.reply({ content: "Ticket close cancelled.", flags: MessageFlags.Ephemeral });
}

async function handleModappStart(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "This button can only be used in a server.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (isApplying(interaction.user.id)) {
    await interaction.reply({
      content: "You already have an application in progress. Please check your DMs.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({
    content: "Check your DMs! I'll walk you through the application one question at a time.",
    flags: MessageFlags.Ephemeral,
  });

  const success = await runModappFlow(interaction.user, guild);
  if (!success) {
    await interaction.followUp({
      content: "I couldn't send you a DM. Please enable DMs from server members and try again.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function onInteractionCreate(interaction: Interaction) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command error");
      const msg: InteractionReplyOptions = { content: "An error occurred while running this command.", flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
    return;
  }

  // Buttons
  if (interaction.isButton()) {
    try {
      switch (interaction.customId) {
        case "ticket_create":
          await handleTicketCreate(interaction);
          break;
        case "ticket_close":
          await handleTicketClose(interaction);
          break;
        case "ticket_cancel_close":
          await handleCancelClose(interaction);
          break;
        case "modapp_start":
          await handleModappStart(interaction);
          break;
      }
    } catch (err) {
      logger.error({ err, customId: interaction.customId }, "Button handler error");
    }
  }
}
