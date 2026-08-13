"use client";

import { useCallback, useEffect, useRef } from "react";
import { Crown, MicOff, User } from "lucide-react";
import { useActiveSpeaker } from "@/hooks/useActiveSpeaker";
import { getAvatarGradient } from "@/lib/utils";
import type { Participant } from "@/types";

interface VideoTileProps {
  participant: Participant;
  onSpeakingChange?: (peerId: string, speaking: boolean) => void;
}

export function VideoTile({ participant, onSpeakingChange }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const speakingHandlerRef = useRef(onSpeakingChange);
  speakingHandlerRef.current = onSpeakingChange;

  const handleSpeaking = useCallback(
    (speaking: boolean) => {
      speakingHandlerRef.current?.(participant.peerId, speaking);
    },
    [participant.peerId]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (participant.stream) {
      video.srcObject = participant.stream;
      void video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [participant.stream]);

  useActiveSpeaker(participant.stream, handleSpeaking, participant.isLocal ? 20 : 15);

  const showVideo =
    participant.stream &&
    participant.videoEnabled &&
    participant.stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");

  const initials = participant.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarGradient = getAvatarGradient(participant.name);

  return (
    <div
      className={`group relative aspect-video w-full overflow-hidden rounded-2xl bg-meet-surface transition-all duration-300 ${
        participant.isSpeaking
          ? "ring-[3px] ring-meet-green shadow-glow-green scale-[1.008]"
          : participant.isHost
            ? "ring-2 ring-amber-400/50"
            : "ring-1 ring-white/[0.08] hover:ring-white/15"
      }`}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className={`h-full w-full object-cover ${participant.isLocal ? "scale-x-[-1]" : ""}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-meet-bg to-meet-surface">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-3xl font-semibold text-white shadow-float ${
              participant.isHost ? "ring-2 ring-amber-400/60 ring-offset-2 ring-offset-meet-surface" : ""
            }`}
          >
            {initials || <User className="h-10 w-10" />}
          </div>
        </div>
      )}

      {participant.isSpeaking && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-meet-green/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Speaking
        </div>
      )}

      {participant.isHost && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-meet-bg shadow-sm">
          <Crown className="h-3 w-3" />
          Host
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur-md">
        {!participant.audioEnabled && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-meet-red/90">
            <MicOff className="h-3 w-3" />
          </span>
        )}
        <span className="truncate font-medium">
          {participant.name}
          {participant.isLocal ? " (You)" : ""}
        </span>
      </div>
    </div>
  );
}
