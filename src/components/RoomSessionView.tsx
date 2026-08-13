"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, RefreshCw, ShieldX, Users, Video } from "lucide-react";
import { ChatDrawer } from "@/components/ChatDrawer";
import { ControlBar, Toast } from "@/components/ControlBar";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { VideoTile } from "@/components/VideoTile";
import { WaitingRoomBadge } from "@/components/WaitingRoomPanel";
import { AppHeader } from "@/components/ui/AppHeader";
import { Logo } from "@/components/ui/Logo";
import type { useLocalMedia } from "@/hooks/useLocalMedia";
import type { useRoomSession } from "@/hooks/useRoomSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMeetingTimer } from "@/hooks/useMeetingTimer";
import { formatDuration, getAvatarGradient, getGridClass, getMeetingUrl, playKnockSound } from "@/lib/utils";
import { playAdmitSound, playChatSound } from "@/lib/sounds";

type LocalMedia = ReturnType<typeof useLocalMedia>;
type RoomSession = ReturnType<typeof useRoomSession>;

interface RoomSessionViewProps {
  roomId: string;
  displayName: string;
  media: LocalMedia;
  session: RoomSession;
}

export function RoomSessionView({
  roomId,
  displayName,
  media,
  session,
}: RoomSessionViewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [unreadChat, setUnreadChat] = useState(0);
  const prevWaitingCount = useRef(0);
  const prevChatLen = useRef(0);

  const {
    stream,
    streamRef,
    videoEnabled,
    audioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    cleanup,
  } = media;

  const {
    phase,
    participants,
    chatMessages,
    waitingRequests,
    isConnected,
    isHost,
    connectionError,
    denyReason,
    sendChatMessage,
    setParticipantSpeaking,
    replaceOutgoingTracks,
    admitParticipant,
    denyParticipant,
    admitAll,
    disconnect,
    retryKnock,
  } = session;

  const meetingSeconds = useMeetingTimer(isConnected && phase === "meeting");

  const prevRemoteCount = useRef(0);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (!isHost) return;
    if (waitingRequests.length > prevWaitingCount.current) {
      playKnockSound();
      setPeopleOpen(true);
      setChatOpen(false);
    }
    prevWaitingCount.current = waitingRequests.length;
  }, [waitingRequests.length, isHost]);

  useEffect(() => {
    if (!isHost || phase !== "meeting") return;
    const remoteCount = participants.filter((p) => !p.isLocal).length;
    if (remoteCount > prevRemoteCount.current) {
      import("@/lib/sounds").then((m) => m.playJoinSound()).catch(() => {});
    }
    prevRemoteCount.current = remoteCount;
  }, [participants, phase, isHost]);

  useEffect(() => {
    if (chatMessages.length > prevChatLen.current && !chatOpen) {
      setUnreadChat((n) => n + (chatMessages.length - prevChatLen.current));
      playChatSound();
    }
    prevChatLen.current = chatMessages.length;
  }, [chatMessages.length, chatOpen]);

  const handleToggleScreenShare = useCallback(async () => {
    const newStream = await toggleScreenShare();
    if (newStream) replaceOutgoingTracks(newStream);
  }, [toggleScreenShare, replaceOutgoingTracks]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    setTimeout(() => {
      if (streamRef.current) replaceOutgoingTracks(streamRef.current);
    }, 0);
  }, [toggleVideo, streamRef, replaceOutgoingTracks]);

  const handleToggleChat = useCallback(() => {
    setChatOpen((open) => {
      if (!open) setUnreadChat(0);
      return !open;
    });
    setPeopleOpen(false);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = getMeetingUrl(roomId);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Meeting link copied!");
    } catch {
      showToast(`Meeting ID: ${roomId}`);
    }
  }, [roomId, showToast]);

  const handleLeave = useCallback(() => {
    disconnect();
    cleanup();
    router.push("/");
  }, [disconnect, cleanup, router]);

  useKeyboardShortcuts(
    {
      onToggleAudio: toggleAudio,
      onToggleVideo: handleToggleVideo,
      onToggleChat: handleToggleChat,
      onCopyLink: handleCopyLink,
    },
    isConnected && phase === "meeting"
  );

  if (phase === "denied") {
    return (
      <div className="dark-gradient flex min-h-screen flex-col text-white">
        <AppHeader
          right={
            <button
              onClick={() => router.push("/")}
              className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-meet-hover hover:text-white"
            >
              Leave
            </button>
          }
        />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="animate-slide-up w-full max-w-md rounded-3xl border border-white/10 bg-meet-surface/80 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-meet-red/20">
              <ShieldX className="h-8 w-8 text-meet-red" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold">Entry denied</h1>
            <p className="mb-6 text-white/55">{denyReason}</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-meet-accent px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-blue-300"
            >
              Return home
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "waiting") {
    const showVideo =
      stream && videoEnabled && stream.getVideoTracks().some((t) => t.enabled);
    const avatarGradient = getAvatarGradient(displayName);

    return (
      <div className="dark-gradient flex min-h-screen flex-col text-white">
        <AppHeader
          right={
            <button
              onClick={handleLeave}
              className="rounded-xl px-3.5 py-2 text-sm text-white/60 transition hover:bg-meet-hover hover:text-white"
            >
              Leave
            </button>
          }
        />

        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="animate-slide-up w-full max-w-lg">
            {connectionError ? (
              <div className="glass-panel rounded-3xl p-8 text-center shadow-glow">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/15">
                  <ShieldX className="h-8 w-8 text-yellow-400" />
                </div>
                <h1 className="mb-2 text-2xl font-bold">Connection lost</h1>
                <p className="mb-6 text-white/50">{connectionError}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={retryKnock}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-meet-accent px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-blue-300 active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium transition hover:bg-meet-hover"
                  >
                    Go home
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mx-auto mb-6 aspect-video overflow-hidden rounded-3xl bg-meet-surface ring-1 ring-white/[0.08] shadow-float">
                  {showVideo ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full scale-x-[-1] object-cover opacity-60"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-4xl font-bold shadow-float`}
                      >
                        {(displayName[0] || "G").toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <div className="relative">
                      <div className="absolute -inset-4 animate-pulse-ring rounded-full bg-meet-accent/15" />
                      <Loader2 className="relative h-12 w-12 animate-spin text-meet-accent" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-8 text-center shadow-glow">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-meet-accent/15">
                    <Clock className="h-7 w-7 text-meet-accent" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold">Waiting for the host</h1>
                  <p className="mb-1 text-white/50">
                    Hi <span className="font-semibold text-white">{displayName}</span> — the host
                    will let you in shortly.
                  </p>
                  <p className="mb-6 font-mono text-sm text-meet-accent/70">{roomId}</p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-meet-bg/60 px-4 py-2 text-xs text-white/35">
                    <Video className="h-3.5 w-3.5" />
                    Audio and video start after admission
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  const remoteCount = participants.filter((p) => !p.isLocal).length;
  const hostName =
    participants.find((p) => p.isHost && !p.isLocal)?.name ??
    participants.find((p) => p.isHost)?.name ??
    "Host";
  const participantCount = Math.max(participants.length, 1);

  return (
    <div className="dark-gradient flex min-h-screen flex-col text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-meet-surface/40 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="sm" showText={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-mono text-sm font-medium text-meet-accent">{roomId}</p>
              {isConnected && (
                <span className="hidden items-center gap-1.5 rounded-full bg-meet-bg/80 px-2.5 py-0.5 text-xs tabular-nums text-white/50 sm:flex">
                  <Clock className="h-3 w-3" />
                  {formatDuration(meetingSeconds)}
                </span>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-white/45">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-meet-green shadow-[0_0_6px_rgba(52,168,83,0.6)]" : "animate-pulse bg-yellow-400"
                }`}
              />
              {isConnected ? (isHost ? "You are the host" : `Host: ${hostName}`) : "Connecting…"}
              {isHost && <WaitingRoomBadge count={waitingRequests.length} />}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setPeopleOpen(true);
            setChatOpen(false);
          }}
          className="relative flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-meet-bg/60 px-3.5 py-2 text-sm font-medium backdrop-blur transition hover:bg-meet-hover"
        >
          <Users className="h-4 w-4 text-meet-accent" />
          <span>{participants.length}</span>
          {waitingRequests.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-meet-red px-1 text-[10px] font-bold ring-2 ring-meet-surface">
              {waitingRequests.length}
            </span>
          )}
        </button>
      </header>

      {connectionError && (
        <div className="mx-4 mt-3 shrink-0 rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-200/90">
          Connection issue: {connectionError}
        </div>
      )}

      {isHost && waitingRequests.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setPeopleOpen(true);
            setChatOpen(false);
          }}
          className="mx-4 mt-3 shrink-0 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border border-meet-accent/25 bg-meet-accent/10 px-4 py-3 text-left text-sm transition hover:bg-meet-accent/15 sm:mx-6 sm:w-auto"
        >
          <span className="text-meet-accent">
            {waitingRequests.length} {waitingRequests.length === 1 ? "person" : "people"} waiting
          </span>
          <span className="text-xs text-white/50">Open People →</span>
        </button>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-40 pt-4 sm:px-6">
        <div className={`grid flex-1 gap-3 sm:gap-4 ${getGridClass(participantCount)}`}>
          {participants.length === 0 ? (
            <div className="col-span-full flex min-h-[55vh] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/[0.08] bg-meet-surface/30">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 animate-pulse-ring rounded-full bg-meet-accent/15" />
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-meet-accent border-t-transparent" />
                </div>
              </div>
              <p className="text-sm text-white/45">Connecting to the meeting…</p>
            </div>
          ) : (
            participants.map((participant) => (
              <VideoTile
                key={participant.peerId}
                participant={participant}
                onSpeakingChange={setParticipantSpeaking}
              />
            ))
          )}
        </div>

        {remoteCount === 0 && isConnected && isHost && waitingRequests.length === 0 && (
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-meet-surface/40 px-6 py-5 text-center">
            <p className="text-sm text-white/50">
              Share the meeting link — guests will appear in the waiting room.
            </p>
            <button
              onClick={handleCopyLink}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-meet-accent/15 px-4 py-2 text-sm font-semibold text-meet-accent transition hover:bg-meet-accent/25"
            >
              Copy invite link
            </button>
          </div>
        )}
      </main>

      <ControlBar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        chatOpen={chatOpen}
        peopleOpen={peopleOpen}
        unreadChat={unreadChat}
        waitingCount={isHost ? waitingRequests.length : 0}
        onToggleAudio={toggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={handleToggleChat}
        onTogglePeople={() => {
          setPeopleOpen((open) => !open);
          setChatOpen(false);
        }}
        onCopyLink={handleCopyLink}
        onLeave={handleLeave}
      />

      <ParticipantsPanel
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        participants={participants}
        waitingRequests={waitingRequests}
        roomId={roomId}
        isHost={isHost}
        onAdmit={(peerId) => {
          admitParticipant(peerId);
          playAdmitSound();
          showToast("Participant admitted");
        }}
        onDeny={(peerId) => {
          denyParticipant(peerId);
          showToast("Participant denied");
        }}
        onAdmitAll={() => {
          admitAll();
          playAdmitSound();
          showToast("All participants admitted");
        }}
      />

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSend={sendChatMessage}
      />

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
