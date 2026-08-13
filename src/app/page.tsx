"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowRight, Crown, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const features = [
  {
    title: "Instant rooms",
    detail: "Create a meeting in one click. No signup, no install.",
  },
  {
    title: "Waiting room",
    detail: "Guests knock — you admit or deny before they enter.",
  },
  {
    title: "Host controls",
    detail: "Mute, stop video, or remove anyone from the People panel.",
  },
  {
    title: "Screen share & chat",
    detail: "Share your screen and message everyone in the call.",
  },
  {
    title: "Peer-to-peer",
    detail: "Video flows directly between browsers. Nothing stored on a server.",
  },
];

const browsers = ["Chrome", "Brave", "Opera", "Edge", "Firefox", "Safari"];

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
        <header className="mb-16 flex items-center justify-between sm:mb-20">
          <Logo variant="light" size="md" />
          <button
            onClick={handleStartMeeting}
            disabled={starting}
            className="hidden border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition hover:border-zinc-900 sm:block disabled:opacity-50"
          >
            {starting ? "Opening…" : "New meeting"}
          </button>
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_360px] lg:gap-16">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Free video meetings
            </p>

            <h1 className="mb-6 max-w-xl text-4xl font-medium leading-[1.15] tracking-tight sm:text-5xl">
              Open a room.
              <br />
              Send a link.
              <br />
              That&apos;s it.
            </h1>

            <p className="mb-8 max-w-md text-base leading-relaxed text-zinc-600">
              KnotCall runs in your browser. Share a link, admit guests from the
              waiting room, and host the call with full controls — no account needed.
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

            <div className="mb-10 flex flex-wrap gap-2">
              {browsers.map((browser) => (
                <span
                  key={browser}
                  className="border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-600"
                >
                  {browser}
                </span>
              ))}
            </div>

            <div className="border-t border-zinc-300 pt-10">
              <p className="mb-6 text-sm font-medium text-zinc-900">What you get</p>
              <ul className="space-y-5">
                {features.map((feature) => (
                  <li key={feature.title}>
                    <p className="text-sm font-medium text-zinc-900">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{feature.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-12 border border-zinc-300 bg-zinc-900 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400">k7x9m2p4q1</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    <Crown className="h-2.5 w-2.5" />
                    Host
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums text-zinc-500">12:04</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-700/80 bg-sky-500/10 px-4 py-2">
                <span className="text-[11px] text-sky-300">1 person waiting</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Users className="h-3 w-3" />
                  People
                </span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-zinc-800 p-px">
                {[
                  { name: "You", host: true, speaking: false },
                  { name: "Maya", host: false, speaking: true },
                  { name: "Chris", host: false, speaking: false },
                  { name: "Sam", host: false, speaking: false },
                ].map((tile) => (
                  <div key={tile.name} className="relative aspect-[4/3] bg-zinc-800">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-lg font-medium text-zinc-600">{tile.name[0]}</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-[11px] text-zinc-400">
                      {tile.name}
                      {tile.host ? " · host" : ""}
                    </span>
                    {tile.speaking && (
                      <span className="absolute inset-0 ring-1 ring-inset ring-green-500/80" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-1.5 border-t border-zinc-700 px-4 py-3">
                <div className="h-8 w-8 bg-zinc-700" />
                <div className="h-8 w-8 bg-zinc-700" />
                <div className="h-8 w-8 bg-zinc-700" />
                <div className="h-8 w-8 bg-zinc-700" />
                <div className="h-8 w-8 bg-red-800/80" />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">
              Waiting room, host controls, and in-call video
            </p>
          </div>
        </div>

        <section className="mt-20 grid gap-8 border-t border-zinc-300 pt-12 sm:grid-cols-3">
          {[
            { step: "1", label: "Start", text: "Click Start a meeting. You become the host." },
            { step: "2", label: "Share", text: "Copy the room link and send it to guests." },
            { step: "3", label: "Host", text: "Admit from the waiting room. Mute or remove as needed." },
          ].map((item) => (
            <div key={item.step}>
              <p className="mb-2 font-mono text-xs text-zinc-400">{item.step}</p>
              <p className="mb-1 text-sm font-medium text-zinc-900">{item.label}</p>
              <p className="text-sm leading-relaxed text-zinc-600">{item.text}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 border-t border-zinc-300 pt-8 text-xs text-zinc-500">
          <p>KnotCall · Peer-to-peer video · Works on Netlify and any HTTPS host</p>
        </footer>
      </div>
    </div>
  );
}
