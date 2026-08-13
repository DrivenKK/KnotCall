"use client";

import {
  Check,
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

interface ControlBarProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  chatOpen: boolean;
  peopleOpen: boolean;
  unreadChat?: number;
  waitingCount?: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onTogglePeople: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
}

function ControlButton({
  active,
  danger,
  muted,
  label,
  onClick,
  children,
  badge,
}: {
  active?: boolean;
  danger?: boolean;
  muted?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
          danger
            ? "bg-meet-red text-white shadow-lg shadow-meet-red/30 hover:bg-red-500 hover:shadow-meet-red/40"
            : muted
              ? "bg-meet-red/90 text-white hover:bg-meet-red"
              : active
                ? "bg-meet-accent text-gray-900 shadow-lg shadow-meet-accent/25 hover:bg-blue-300"
                : "bg-meet-hover/90 text-white hover:bg-meet-hover hover:shadow-float"
        }`}
      >
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-meet-red px-1 text-[10px] font-bold text-white ring-2 ring-meet-surface">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      <span className="hidden text-[10px] font-medium text-white/45 lg:block">{label}</span>
    </div>
  );
}

export function ControlBar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  chatOpen,
  peopleOpen,
  unreadChat = 0,
  waitingCount = 0,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onTogglePeople,
  onCopyLink,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-5 pt-8 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-meet-bg via-meet-bg/80 to-transparent" />
      <div className="pointer-events-auto relative mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-[1.75rem] border border-white/[0.08] bg-meet-surface/85 px-4 py-3 shadow-float backdrop-blur-2xl sm:gap-2.5 sm:px-5 sm:py-3.5">
          <ControlButton
            label={audioEnabled ? "Mute" : "Unmute"}
            onClick={onToggleAudio}
            muted={!audioEnabled}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </ControlButton>

          <ControlButton
            label={videoEnabled ? "Stop cam" : "Start cam"}
            onClick={onToggleVideo}
            muted={!videoEnabled}
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </ControlButton>

          <ControlButton
            label={isScreenSharing ? "Stop share" : "Share"}
            onClick={onToggleScreenShare}
            active={isScreenSharing}
          >
            <MonitorUp className="h-5 w-5" />
          </ControlButton>

          <div className="mx-1 hidden h-9 w-px shrink-0 bg-white/10 sm:block" />

          <ControlButton
            label="People"
            onClick={onTogglePeople}
            active={peopleOpen}
            badge={waitingCount}
          >
            <Users className="h-5 w-5" />
          </ControlButton>

          <ControlButton
            label="Chat"
            onClick={onToggleChat}
            active={chatOpen}
            badge={unreadChat}
          >
            <MessageSquare className="h-5 w-5" />
          </ControlButton>

          <ControlButton label="Copy link" onClick={onCopyLink}>
            <Copy className="h-5 w-5" />
          </ControlButton>

          <div className="mx-1 hidden h-9 w-px shrink-0 bg-white/10 sm:block" />

          <ControlButton label="Leave" onClick={onLeave} danger>
            <PhoneOff className="h-5 w-5" />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-32 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-white/10 bg-meet-surface/95 px-5 py-3 text-sm font-medium text-white shadow-float backdrop-blur-xl transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-meet-green/20">
        <Check className="h-3.5 w-3.5 text-meet-green" />
      </span>
      {message}
    </div>
  );
}
