import type { CollabUser } from "../types/editor";

export function normalizeAwarenessUsers(
  awarenessStates: Map<number, Record<string, unknown>>,
  localClientId: number,
): CollabUser[] {
  const users: CollabUser[] = [];
  for (const [clientId, state] of awarenessStates) {
    if (clientId === localClientId) continue;
    const user = state.user;
    if (
      user !== null &&
      typeof user === "object" &&
      typeof (user as Record<string, unknown>).id === "string" &&
      typeof (user as Record<string, unknown>).name === "string" &&
      typeof (user as Record<string, unknown>).color === "string"
    ) {
      users.push(user as CollabUser);
    }
  }
  return users;
}

export function buildProviderUrl(wsUrl: string, roomName: string, authToken?: string): string {
  const base = `${wsUrl}/${encodeURIComponent(roomName)}`;
  if (!authToken) return base;
  return `${base}?token=${encodeURIComponent(authToken)}`;
}
