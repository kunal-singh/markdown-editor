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

// Local (new-page) mode: no WebSocket, no cursor awareness.
// provider is null so CollaborationCursor is skipped by buildExtensions.
export interface LocalEditorResult {
  doc: Y.Doc;
  provider: null;
  status: "disconnected";
  connectedUsers: [];
}
