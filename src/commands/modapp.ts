import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  DMChannel,
  Colors,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../types.js";
import { isApplying, startApplication, endApplication, getAppChannel } from "../applicationStore.js";
import { logger } from "../../lib/logger.js";

const QUESTIONS = [
  "**Question 1/9**\nWhat is your Discord username?",
  "**Question 2/9**\nWhat is your age?",
  "**Question 3/9**\nWhy do you want to become a moderator in the Obsession Discord?",
  "**Question 4/9**\nWhat strengths would you bring to the staff team?",
  "**Question 5/9**\nA member is spamming, arguing, and being rude in chat. What would you do?",
  "**Question 6/9**\nHow active can you realistically be each day or week?",
  "**Question 7/9**\nHave you moderated any Discord servers before? If yes, describe your experience.",
  "**Question 8/9**\nWhy should we choose you over other applicants?",
  "**Question 9/9**\nDo you agree that asking about your application status may result in immediate denial? (Yes/No)",
];

const QUESTION_LABELS = [
  "Discord Username",
  "Age",
  "Why do you want to be a moderator?",
  "Strengths you bring",
  "Handling a disruptive member",
  "Activity level",
  "Previous moderation experience",
  "Why choose you?",
  "Agree to status inquiry policy",
];

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per question

export const modapp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("modapp")
    .setDescription("Apply to become a moderator for Obsession"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: "This command must be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const user = interaction.user;

    if (isApplying(user.id)) {
      await interaction.reply({
        content: "You already have a mod application in progress. Please check your DMs.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Try to open a DM
    let dm: DMChannel;
    try {
      dm = await user.createDM();
    } catch {
      await interaction.reply({
        content: "I couldn't send you a DM. Please enable DMs from server members and try again.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: "Check your DMs! I'll walk you through the moderator application one question at a time.",
      flags: MessageFlags.Ephemeral,
    });

    startApplication(user.id);

    const answers: string[] = [];

    try {
      // Intro message
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Obsession — Moderator Application")
            .setDescription(
              "Welcome! I'll ask you **9 questions** one at a time.\n\n" +
              "• Take your time to answer thoughtfully.\n" +
              "• You have **5 minutes** to answer each question.\n" +
              "• Type `cancel` at any time to withdraw your application.",
            )
            .setColor(Colors.Blurple)
            .setTimestamp(),
        ],
      });

      for (let i = 0; i < QUESTIONS.length; i++) {
        await dm.send(QUESTIONS[i]!);

        const collected = await dm
          .awaitMessages({
            filter: (m) => m.author.id === user.id,
            max: 1,
            time: TIMEOUT_MS,
            errors: ["time"],
          })
          .catch(() => null);

        if (!collected || collected.size === 0) {
          await dm.send(
            "⏰ Your application has expired due to inactivity. Run `/modapp` in the server to start again.",
          );
          endApplication(user.id);
          return;
        }

        const answer = collected.first()!.content.trim();

        if (answer.toLowerCase() === "cancel") {
          await dm.send("Your application has been cancelled. Run `/modapp` in the server if you'd like to apply again.");
          endApplication(user.id);
          return;
        }

        answers.push(answer);

        if (i < QUESTIONS.length - 1) {
          await dm.send("✅ Got it! Moving to the next question…");
        }
      }

      // All questions answered — build the application embed
      const appEmbed = new EmbedBuilder()
        .setTitle("New Moderator Application")
        .setAuthor({
          name: `${user.tag} (${user.id})`,
          iconURL: user.displayAvatarURL(),
        })
        .setColor(Colors.Gold)
        .setTimestamp()
        .setFooter({ text: `User ID: ${user.id}` });

      for (let i = 0; i < QUESTION_LABELS.length; i++) {
        appEmbed.addFields({
          name: QUESTION_LABELS[i]!,
          value: answers[i] ?? "—",
        });
      }

      // Post to the configured applications channel
      const channelId = getAppChannel(guild.id);
      let posted = false;

      if (channelId) {
        const appChannel = guild.channels.cache.get(channelId);
        if (appChannel instanceof TextChannel) {
          await appChannel.send({ embeds: [appEmbed] });
          posted = true;
        }
      }

      if (!posted) {
        // Fallback: try to find a channel named mod-applications or staff-applications
        const fallback = guild.channels.cache.find(
          (c) =>
            c instanceof TextChannel &&
            (c.name === "mod-applications" ||
              c.name === "staff-applications" ||
              c.name === "applications"),
        );

        if (fallback instanceof TextChannel) {
          await fallback.send({ embeds: [appEmbed] });
          posted = true;
        }
      }

      if (!posted) {
        logger.warn({ guildId: guild.id, userId: user.id }, "No mod-app channel found — application not posted");
      }

      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Application Submitted!")
            .setDescription(
              "Thank you for applying to the Obsession staff team! 🎉\n\n" +
              "Your application has been submitted for review. Please be patient — **do not ask about your application status**, as this may result in immediate denial.",
            )
            .setColor(Colors.Green)
            .setTimestamp(),
        ],
      });

      endApplication(user.id);
    } catch (err) {
      endApplication(user.id);
      logger.error({ err, userId: user.id }, "Error during mod application");
      await dm.send("Something went wrong during your application. Please try again later.").catch(() => null);
    }
  },
};
