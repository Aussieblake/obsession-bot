/**
 * Tracks which users currently have an active mod application in progress
 * and which channel finished applications are sent to (per guild).
 * Channel config is persisted to disk so it survives restarts.
 */

import { getConfig, setConfig } from "./configStore.js";

const activeApplicants = new Set<string>();

export function isApplying(userId: string): boolean {
  return activeApplicants.has(userId);
}

export function startApplication(userId: string): void {
  activeApplicants.add(userId);
}

export function endApplication(userId: string): void {
  activeApplicants.delete(userId);
}

export function setAppChannel(guildId: string, channelId: string): void {
  setConfig(`modapp_channel_${guildId}`, channelId);
}

export function getAppChannel(guildId: string): string | undefined {
  return getConfig(`modapp_channel_${guildId}`);
}
