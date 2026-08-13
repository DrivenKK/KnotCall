"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const includes = [
  "Host-controlled waiting room",
  "Screen sharing and in-call chat",
  "Peer-to-peer video — nothing stored on a server",
  "Works in Chrome, Brave, Opera, Edge, Firefox, Safari, and other Chromium browsers",
];

export default function LandingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [starting, setStarting] = useState(false);

  const handleStartMeeting = () => {
    setStarting(true);
    const roomId = nanoid(10);
    sessionStorage.setItem(`knotcall-host-${roomId}`, "1");
    router.push(`/room/${roomId}`);
  };

  const handleJoinMeeting = (event: FormEvent) => {
    event.preventDefault();
    const code = roomCode.trim();
    if (!code) return;
    const id = code.includes("/room/") ? code.split("/room/").pop()!.split(/[?#]/)[0] : code;
    router.push(`/room/${id}`);
  };

  return (
    <div className="landing-bg min-h-screen text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-8 sm:px-10 sm:pt-12">
        <header className="mb-16 flex items-center justify-between sm:mb-24">
          <Logo variant="light" size="md" />
          <button
            onClick={handleStartMeeting}
            disabled={starting}
            className="hidden border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition hover:border-zinc-900 sm:block disabled:opacity-50"
          >
            {starting ? "Opening…" : "New meeting"}
          </button>
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_340px] lg:gap-20">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Video meetings
            </p>

            <h1 className="mb-6 max-w-xl text-4xl font-medium leading-[1.15] tracking-tight sm:text-5xl">
              Open a room.
              <br />
              Send a link.
              <br />
              That&apos;s it.
            </h1>

            <p className="mb-10 max-w-md text-base leading-relaxed text-zinc-600">
              KnotCall runs in your browser. No account, no install, no bill.
              You get a link — share it with whoever needs to join.
            </p>

            <div className="mb-10 space-y-3">
              <button
                onClick={handleStartMeeting}
                disabled={starting}
                className="w-full max-w-sm bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
              >
                {starting ? "Creating room…" : "Start a meeting"}
              </button>

              <form onSubmit={handleJoinMeeting} className="flex max-w-md flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Room code or link"
                  className="flex-1 border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
                />
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="inline-flex items-center justify-center gap-2 border border-zinc-300 bg-white px-5 py-3 text-sm font-medium transition hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Join
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="border-t border-zinc-300 pt-10">
              <p className="mb-4 text-sm font-medium text-zinc-900">Included</p>
              <ul className="space-y-2.5">
                {includes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-600">
                    <span className="mt-2 h-px w-3 shrink-0 bg-zinc-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Static app preview — matches real meeting UI */}
          <div className="hidden lg:block">
            <div className="sticky top-12 border border-zinc-300 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
                <span className="font-mono text-xs text-zinc-400">k7x9m2p4q1</span>
                <span className="font-mono text-xs tabular-nums text-zinc-500">12:04</span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-zinc-800 p-px">
                {["Maya", "Chris", "Sam", "You"].map((name, i) => (
                  <div key={name} className="relative aspect-[4/3] bg-zinc-800">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-lg font-medium text-zinc-600">{name[0]}</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[11px] text-zinc-400">
                      {name}
                      {i === 3 ? " · you" : ""}
                    </span>
                    {i === 1 && (
                      <span className="absolute inset-0 ring-1 ring-inset ring-green-600/80" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-1 border-t border-zinc-700 px-4 py-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 ${i === 4 ? "bg-red-700" : "bg-zinc-700"}`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">What a call looks like</p>
          </div>
        </div>

        <footer className="mt-20 border-t border-zinc-300 pt-8 text-xs text-zinc-500">
          <p>KnotCall · WebRTC · PeerJS · Next.js</p>
        </footer>
      </div>
    </div>
  );
}
