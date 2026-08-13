export interface ChatMessage {
  id: string;
  from: string;
  name: string;
  text: string;
  timestamp: number;
  isLocal: boolean;
}

export interface Participant {
  peerId: string;
  name: string;
  stream: MediaStream | null;
  isLocal: boolean;
  isHost: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isSpeaking: boolean;
}

export interface WaitingRequest {
  id: string;
  name: string;
  requestedAt: number;
}

export type SignalingMessage =
  | { type: "peer-list"; peers: Array<{ id: string; name: string }> }
  | { type: "peer-joined"; id: string; name: string }
  | { type: "peer-left"; id: string }
  | { type: "chat"; from: string; name: string; text: string; timestamp: number }
  | { type: "media-state"; id: string; video: boolean; audio: boolean }
  | { type: "join-request"; id: string; name: string }
  | { type: "join-admitted"; id: string }
  | { type: "join-denied"; id: string; reason?: string }
  | { type: "host-info"; id: string; name: string };

export type MeetingPhase = "lobby" | "checking" | "waiting" | "meeting";

export type RoomRole = "host" | "guest";
