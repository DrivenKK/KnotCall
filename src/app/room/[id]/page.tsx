"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { PreJoinLobby } from "@/components/PreJoinLobby";
import { RoomSessionView } from "@/components/RoomSessionView";
import { createParticipantId, useRoomSession } from "@/hooks/useRoomSession";
import { useLocalMedia } from "@/hooks/useLocalMedia";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const [displayName, setDisplayName] = useState("");
  const [joined, setJoined] = useState(false);
  const [participantId] = useState(createParticipantId);
  const media = useLocalMedia({ autoStart: true });
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const joinCalledRef = useRef(false);

  const onHostCommand = useCallback((command: "mute" | "video-off" | "mute-all") => {
    if (command === "mute" || command === "mute-all") {
      mediaRef.current.forceMute();
    } else if (command === "video-off") {
      mediaRef.current.forceDisableVideo();
    }
  }, []);

  const session = useRoomSession({
    roomId,
    displayName,
    participantId,
    localStream: media.stream,
    videoEnabled: media.videoEnabled,
    audioEnabled: media.audioEnabled,
    onHostCommand,
  });

  const joinRef = useRef(session.join);
  joinRef.current = session.join;

  useEffect(() => {
    if (!joined || !displayName.trim() || joinCalledRef.current) return;
    joinCalledRef.current = true;
    void joinRef.current(displayName.trim());
  }, [joined, displayName]);

  if (!joined) {
    return (
      <PreJoinLobby
        roomId={roomId}
        media={media}
        onJoin={(name) => {
          setDisplayName(name);
          setJoined(true);
        }}
      />
    );
  }

  return (
    <RoomSessionView
      roomId={roomId}
      displayName={displayName}
      media={media}
      session={session}
    />
  );
}
