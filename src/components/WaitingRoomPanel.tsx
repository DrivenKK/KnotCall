"use client";

import { Bell, Check, UserPlus, X } from "lucide-react";
import { getAvatarGradient } from "@/lib/utils";
import type { WaitingRequest } from "@/types";

interface WaitingRoomPanelProps {
  requests: WaitingRequest[];
  onAdmit: (peerId: string) => void;
  onDeny: (peerId: string) => void;
  onAdmitAll: () => void;
}

export function WaitingRoomPanel({
  requests,
  onAdmit,
  onDeny,
  onAdmitAll,
}: WaitingRoomPanelProps) {
  if (requests.length === 0) return null;

  return (
    <div className="mx-4 mt-3 animate-slide-up overflow-hidden rounded-2xl border border-meet-accent/25 bg-meet-surface/90 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-meet-accent/15">
            <Bell className="h-5 w-5 text-meet-accent" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-meet-red text-[10px] font-bold text-white">
              {requests.length}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">Waiting room</p>
            <p className="text-xs text-white/45">
              {requests.length} {requests.length === 1 ? "person" : "people"} waiting
            </p>
          </div>
        </div>
        {requests.length > 1 && (
          <button
            onClick={onAdmitAll}
            className="rounded-xl bg-meet-accent px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-blue-300 active:scale-95"
          >
            Admit all
          </button>
        )}
      </div>

      <div className="max-h-64 divide-y divide-white/[0.06] overflow-y-auto">
        {requests.map((request) => {
          const gradient = getAvatarGradient(request.name);
          return (
            <div
              key={request.id}
              className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-meet-hover/30"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold text-white`}
              >
                {request.name[0]?.toUpperCase() || <UserPlus className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{request.name}</p>
                <p className="text-xs text-white/40">Wants to join</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => onDeny(request.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-meet-red/15 text-meet-red transition hover:bg-meet-red hover:text-white active:scale-95"
                  aria-label={`Deny ${request.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onAdmit(request.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-meet-green/15 text-meet-green transition hover:bg-meet-green hover:text-white active:scale-95"
                  aria-label={`Admit ${request.name}`}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WaitingRoomBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-meet-accent/15 px-2 py-0.5 text-xs font-medium text-meet-accent">
      <Bell className="h-3 w-3" />
      {count} waiting
    </span>
  );
}
