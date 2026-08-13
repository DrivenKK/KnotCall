"use client";

import {
  Check,
  Crown,
  Mic,
  MicOff,
  MoreVertical,
  User,
  UserMinus,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useState } from "react";
import { getAvatarGradient } from "@/lib/utils";
import type { Participant, WaitingRequest } from "@/types";

interface ParticipantsPanelProps {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  waitingRequests: WaitingRequest[];
  roomId: string;
  isHost: boolean;
  onAdmit?: (peerId: string) => void;
  onDeny?: (peerId: string) => void;
  onAdmitAll?: () => void;
  onMute?: (peerId: string) => void;
  onDisableVideo?: (peerId: string) => void;
  onRemove?: (peerId: string) => void;
  onMuteAll?: () => void;
}

function HostActionsMenu({
  participant,
  onMute,
  onDisableVideo,
  onRemove,
}: {
  participant: Participant;
  onMute: () => void;
  onDisableVideo: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-meet-hover hover:text-white"
        aria-label={`Host controls for ${participant.name}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-meet-surface shadow-xl">
            <button
              onClick={() => {
                onMute();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-meet-hover"
            >
              <MicOff className="h-4 w-4 text-meet-red" />
              Mute
            </button>
            <button
              onClick={() => {
                onDisableVideo();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-meet-hover"
            >
              <VideoOff className="h-4 w-4 text-meet-red" />
              Stop video
            </button>
            <button
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2.5 text-left text-sm text-meet-red transition hover:bg-meet-red/10"
            >
              <UserMinus className="h-4 w-4" />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ParticipantRow({
  participant,
  isHostView,
  onMute,
  onDisableVideo,
  onRemove,
}: {
  participant: Participant;
  isHostView?: boolean;
  onMute?: () => void;
  onDisableVideo?: () => void;
  onRemove?: () => void;
}) {
  const initials = participant.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const gradient = getAvatarGradient(participant.name);
  const showHostControls =
    isHostView && !participant.isLocal && !participant.isHost && onMute && onDisableVideo && onRemove;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-meet-bg/50 px-3 py-3">
      <div className="relative shrink-0">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold text-white`}
        >
          {initials || <User className="h-5 w-5" />}
        </div>
        {participant.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-meet-surface bg-meet-green" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {participant.name}
            {participant.isLocal ? " (You)" : ""}
          </span>
          {participant.isHost && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              <Crown className="h-2.5 w-2.5" />
              Host
            </span>
          )}
        </div>
        <p className="truncate text-xs text-white/40">
          {participant.isHost ? "Meeting host" : participant.isLocal ? "In this call" : "In call"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            participant.audioEnabled ? "text-white/50" : "bg-meet-red/15 text-meet-red"
          }`}
        >
          {participant.audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            participant.videoEnabled ? "text-white/50" : "bg-meet-red/15 text-meet-red"
          }`}
        >
          {participant.videoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
        </span>
        {showHostControls && (
          <HostActionsMenu
            participant={participant}
            onMute={onMute}
            onDisableVideo={onDisableVideo}
            onRemove={onRemove}
          />
        )}
      </div>
    </div>
  );
}

function WaitingRow({
  request,
  onAdmit,
  onDeny,
}: {
  request: WaitingRequest;
  onAdmit: () => void;
  onDeny: () => void;
}) {
  const gradient = getAvatarGradient(request.name);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-meet-accent/20 bg-meet-accent/5 px-3 py-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold text-white`}
      >
        {request.name[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{request.name}</p>
        <p className="text-xs text-meet-accent/70">Waiting to join</p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={onDeny}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-meet-red/15 text-meet-red transition hover:bg-meet-red hover:text-white"
          aria-label={`Deny ${request.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onAdmit}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-meet-green/15 text-meet-green transition hover:bg-meet-green hover:text-white"
          aria-label={`Admit ${request.name}`}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ParticipantsPanel({
  open,
  onClose,
  participants,
  waitingRequests,
  roomId,
  isHost,
  onAdmit,
  onDeny,
  onAdmitAll,
  onMute,
  onDisableVideo,
  onRemove,
  onMuteAll,
}: ParticipantsPanelProps) {
  const host = participants.find((p) => p.isHost);
  const others = participants.filter((p) => !p.isHost);
  const inCallCount = participants.length;
  const waitingCount = waitingRequests.length;
  const remoteInCall = others.filter((p) => !p.isLocal).length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/[0.08] bg-meet-surface/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-b border-white/[0.08] px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">People</h2>
              <p className="mt-0.5 text-sm text-white/45">
                {inCallCount} in call
                {waitingCount > 0 && ` · ${waitingCount} waiting`}
                {" · "}
                <span className="font-mono text-meet-accent/80">{roomId}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-meet-hover hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isHost && remoteInCall > 0 && onMuteAll && (
            <button
              onClick={onMuteAll}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-meet-bg/60 px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-meet-hover"
            >
              <MicOff className="h-4 w-4 text-meet-red" />
              Mute all
            </button>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isHost && waitingCount > 0 && onAdmit && onDeny && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-meet-accent/80">
                  Waiting room ({waitingCount})
                </h3>
                {waitingCount > 1 && onAdmitAll && (
                  <button
                    onClick={onAdmitAll}
                    className="text-xs font-medium text-meet-accent transition hover:text-white"
                  >
                    Admit all
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {waitingRequests.map((request) => (
                  <WaitingRow
                    key={request.id}
                    request={request}
                    onAdmit={() => onAdmit(request.id)}
                    onDeny={() => onDeny(request.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {host && (
            <section>
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                Host
              </h3>
              <ParticipantRow participant={host} isHostView={isHost} />
            </section>
          )}

          <section>
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/35">
              In call ({others.length})
            </h3>
            <div className="space-y-2">
              {others.length === 0 && !host ? (
                <p className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-sm text-white/40">
                  Connecting…
                </p>
              ) : (
                others.map((participant) => (
                  <ParticipantRow
                    key={participant.peerId}
                    participant={participant}
                    isHostView={isHost}
                    onMute={onMute ? () => onMute(participant.peerId) : undefined}
                    onDisableVideo={
                      onDisableVideo ? () => onDisableVideo(participant.peerId) : undefined
                    }
                    onRemove={onRemove ? () => onRemove(participant.peerId) : undefined}
                  />
                ))
              )}
              {others.length === 0 && host && participants.length === 1 && (
                <p className="rounded-2xl border border-dashed border-white/10 py-6 text-center text-sm text-white/40">
                  No one else has joined yet.
                </p>
              )}
            </div>
          </section>

          {isHost && (
            <p className="text-center text-xs text-white/30">
              Tap ⋮ on a participant for mute, stop video, or remove.
            </p>
          )}

          {!isHost && waitingCount === 0 && (
            <p className="text-center text-xs text-white/30">
              Guests waiting to join appear here for the host.
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
