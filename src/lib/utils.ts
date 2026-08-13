export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getRoomPeerId(roomId: string): string {
  return `knotcall-${roomId.replace(/[^a-zA-Z0-9-_]/g, "")}`;
}

export function getParticipantPeerId(roomId: string, participantId: string): string {
  return `${getRoomPeerId(roomId)}-${participantId}`;
}

export function generateParticipantId(): string {
  return Math.random().toString(36).slice(2, 10);
}

import { getSiteUrl } from "@/lib/site";

export function getMeetingUrl(roomId: string): string {
  const base = getSiteUrl();
  if (base) return `${base}/room/${roomId}`;
  return `/room/${roomId}`;
}

export function getGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-4xl mx-auto w-full";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-2 md:grid-cols-3";
  if (count <= 9) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function playKnockSound() {
  import("@/lib/sounds").then((m) => m.playKnockSound()).catch(() => {});
}

const AVATAR_GRADIENTS = [
  "from-blue-500/80 to-indigo-600/80",
  "from-emerald-500/80 to-teal-600/80",
  "from-violet-500/80 to-purple-600/80",
  "from-rose-500/80 to-pink-600/80",
  "from-amber-500/80 to-orange-600/80",
  "from-cyan-500/80 to-sky-600/80",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
