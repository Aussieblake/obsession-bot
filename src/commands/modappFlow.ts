import {
  User,
  DMChannel,
  EmbedBuilder,
  TextChannel,
  Colors,
  Guild,
} from "discord.js";
import {
  isApplying,
  startApplication,
  endApplication,
  getAppChannel,
} from "../applicationStore.js";
import { logger } from "../lib/logger.js";

const QUESTIONS = [
  "**Question 1 of 9**\nWhat is your Discord username?",
  "**Question 2 of 9**\nWhat is your age?",
  "**Question 3 of 9**\nWhy do you want to become a moderator in the Obsession Discord?",
  "**Question 4 of 9**\nWhat strengths would you bring to the staff team?",
  "**Question 5 of 9**\nA member is spamming, arguing, and being rude in chat. What would you do?",
  "**Question 6 of 9**\nHow active can you realistically be each day or week?",
  "**Question 7 of 9**\nHave you moderated any Discord servers before? If yes, describe your experience.",
  "**Question 8 of 9**\nWhy should we choose you over other applicants?",
  "**Question 9 of 9**\nDo you agree that asking about your application status may result in immediate denial? (Yes / No)",
];

const LABELS = [
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

/**
 * Runs the full DM interview with `user` and posts the result to the
 * guild's configured applications channel.
 *
 * Returns `true` on success, `false` if the user could not be DMed.
 */
export async function runModappFlow(user: User, guild: Guild): Promise<boolean> {
  if (isApplying(user.id)) return true; // already in progress — considered "handled"

  let dm: DMChannel;
  try {
    dm = await user.createDM();
  } catch {
    return false; // DMs closed
  }

  startApplication(user.id);

  try {
    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Obsession — Moderator Application")
          .setDescription(
            "Welcome! I'll ask you **9 questions** one at a time.\n\n" +
              "• Take your time and answer thoughtfully.\n" +
              "• You have **5 minutes** to answer each question.\n" +
              "• Type `cancel` at any time to withdraw your application.",
          )
          .setColor(Colors.Blurple)
          .setTimestamp(),
      ],
    });

    const answers: string[] = [];

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
          "⏰ Your application expired due to inactivity. Click the button again to restart.",
        );
        endApplication(user.id);
        return true;
      }

      const answer = collected.first()!.content.trim();

      if (answer.toLowerCase() === "cancel") {
        await dm.send(
          "Your application has been cancelled. Click the button again if you'd like to reapply.",
        );
        endApplication(user.id);
        return true;
      }

      answers.push(answer);

      if (i < QUESTIONS.length - 1) {
        await dm.send("✅ Got it! Next question…");
      }
    }

    // Build the application embed
    const appEmbed = new EmbedBuilder()
      .setTitle("New Moderator Application")
      .setAuthor({
        name: `${user.tag} (${user.id})`,
        iconURL: user.displayAvatarURL(),
      })
      .setColor(Colors.Gold)
      .setTimestamp()
      .setFooter({ text: `User ID: ${user.id}` });

    for (let i = 0; i < LABELS.length; i++) {
      appEmbed.addFields({ name: LABELS[i]!, value: answers[i] ?? "—" });
    }

    // Post to configured channel, then fallback to well-known names
    let posted = false;
    const channelId = getAppChannel(guild.id);

    if (channelId) {
      const ch = guild.channels.cache.get(channelId);
      if (ch instanceof TextChannel) {
        await ch.send({ embeds: [appEmbed] });
        posted = true;
      }
    }

    if (!posted) {
      const fallback = guild.channels.cache.find(
        (c) =>
          c instanceof TextChannel &&
          ["mod-applications", "staff-applications", "applications"].includes(c.name),
      );
      if (fallback instanceof TextChannel) {
        await fallback.send({ embeds: [appEmbed] });
        posted = true;
      }
    }

    if (!posted) {
      logger.warn({ guildId: guild.id, userId: user.id }, "No mod-app channel configured");
    }

    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Application Submitted! 🎉")
          .setDescription(
            "Thank you for applying to the Obsession staff team!\n\n" +
              "Your application has been submitted for review. Please be patient — " +
              "**do not ask about your application status**, as this may result in immediate denial.",
          )
          .setColor(Colors.Green)
          .setTimestamp(),
      ],
    });

    endApplication(user.id);
    return true;
  } catch (err) {
    endApplication(user.id);
    logger.error({ err, userId: user.id }, "Error during mod application flow");
    await dm.send("Something went wrong. Please try again later.").catch(() => null);
    return true;
  }
}
