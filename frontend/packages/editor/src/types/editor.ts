import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

export interface UseCollaborationOptions {
  wsUrl: string;
  roomName: string;
  currentUser: CollabUser;
  authToken?: string;
}

export interface UseCollaborationResult {
  doc: Y.Doc;
  provider: WebsocketProvider;
  status: ConnectionStatus;
  connectedUsers: CollabUser[];
}

// null = refs not yet populated (before the WS effect fires on first render).
export type CollaborationReady = UseCollaborationResult;
export type CollaborationState = CollaborationReady | null;
