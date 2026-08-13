"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { AppHeader } from "@/components/ui/AppHeader";
import type { useLocalMedia } from "@/hooks/useLocalMedia";
import { getAvatarGradient, getMeetingUrl } from "@/lib/utils";
import { resumeAudio } from "@/lib/sounds";

type LocalMedia = ReturnType<typeof useLocalMedia>;

interface PreJoinLobbyProps {
  roomId: string;
  media: LocalMedia;
  onJoin: (displayName: string) => void;
}

export function PreJoinLobby({ roomId, media, onJoin }: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const {
    stream,
    videoEnabled,
    audioEnabled,
    error,
    isLoading,
    toggleVideo,
    toggleAudio,
    replaceStreamTracks,
  } = media;

  useEffect(() => {
    const saved = sessionStorage.getItem("knotcall-display-name");
    if (saved) setDisplayName(saved);
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const handleJoin = () => {
    resumeAudio();
    const name = displayName.trim() || "Guest";
    sessionStorage.setItem("knotcall-display-name", name);
    if (!stream && !isLoading) replaceStreamTracks(new MediaStream());
    onJoin(name);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getMeetingUrl(roomId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const showVideo =
    stream && videoEnabled && stream.getVideoTracks().some((t) => t.enabled);

  const name = displayName.trim() || "Guest";
  const avatarGradient = getAvatarGradient(name);

  return (
    <div className="dark-gradient flex min-h-screen flex-col text-white">
      <AppHeader
        right={
          <button
            onClick={() => router.push("/")}
            className="rounded-xl px-3.5 py-2 text-sm text-white/60 transition hover:bg-meet-hover hover:text-white"
          >
            Back to home
          </button>
        }
      />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="animate-slide-up w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Ready to join?</h1>
            <p className="text-white/50">Set up your camera and mic before entering the room</p>
          </div>

          <div className="glass-panel overflow-hidden rounded-3xl shadow-glow">
            <div className="grid lg:grid-cols-5">
              <div className="relative lg:col-span-3">
                <div className="relative aspect-video bg-meet-bg">
                  {isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-white/40">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-meet-accent border-t-transparent" />
                      <p className="text-sm">Requesting camera access…</p>
                    </div>
                  ) : showVideo ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full scale-x-[-1] object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <div
                        className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-5xl font-bold shadow-float`}
                      >
                        {name[0].toUpperCase()}
                      </div>
                      <p className="text-sm text-white/40">Camera is off</p>
                    </div>
                  )}

                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-3">
                    {[
                      { on: audioEnabled, onIcon: Mic, offIcon: MicOff, toggle: toggleAudio, label: "Mic" },
                      { on: videoEnabled, onIcon: Video, offIcon: VideoOff, toggle: toggleVideo, label: "Camera" },
                    ].map(({ on, onIcon: OnIcon, offIcon: OffIcon, toggle, label }) => (
                      <button
                        key={label}
                        onClick={toggle}
                        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-float transition hover:scale-105 active:scale-95 ${
                          on ? "bg-meet-hover/90 hover:bg-meet-hover" : "bg-meet-red hover:bg-red-500"
                        }`}
                        aria-label={label}
                      >
                        {on ? <OnIcon className="h-5 w-5" /> : <OffIcon className="h-5 w-5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-5 p-6 lg:col-span-2 lg:p-8">
                <div>
                  <label htmlFor="display-name" className="mb-2 block text-sm font-medium text-white/70">
                    Display name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={40}
                    className="w-full rounded-xl border border-white/10 bg-meet-bg/80 px-4 py-3.5 text-white outline-none transition placeholder:text-white/35 focus:border-meet-accent focus:ring-2 focus:ring-meet-accent/20"
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-white/70">Meeting code</p>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-meet-bg/60 px-3 py-2.5">
                    <code className="flex-1 truncate font-mono text-sm text-meet-accent">{roomId}</code>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-lg bg-meet-hover/60 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-meet-hover hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-meet-red/30 bg-meet-red/10 px-4 py-3 text-sm text-red-300">
                    {error}. You can still join without camera.
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-meet-accent py-4 text-sm font-bold text-gray-900 shadow-lg shadow-meet-accent/20 transition hover:bg-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Join now
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-xs leading-relaxed text-white/30">
                  End-to-end peer connection. Nothing is recorded or stored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
