/**
 * In-memory store that maps userId -> ticketChannelId.
 * Prevents users from opening duplicate tickets.
 */
const openTickets = new Map<string, string>();

export function hasOpenTicket(userId: string): boolean {
  return openTickets.has(userId);
}

export function getTicketChannel(userId: string): string | undefined {
  return openTickets.get(userId);
}

export function registerTicket(userId: string, channelId: string): void {
  openTickets.set(userId, channelId);
}

export function removeTicket(userId: string): void {
  openTickets.delete(userId);
}

export function getOwnerByChannel(channelId: string): string | undefined {
  for (const [userId, cid] of openTickets) {
    if (cid === channelId) return userId;
  }
  return undefined;
}
