"use client";

import { use, useEffect, useRef, useState } from "react";
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
  const joinStartedRef = useRef(false);

  const session = useRoomSession({
    roomId,
    displayName,
    participantId,
    localStream: media.stream,
    videoEnabled: media.videoEnabled,
    audioEnabled: media.audioEnabled,
  });

  useEffect(() => {
    if (!joined || !displayName || joinStartedRef.current) return;
    joinStartedRef.current = true;
    session.join(displayName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
