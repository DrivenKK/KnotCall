"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import type { ChatMessage } from "@/types";
import { formatTime, getAvatarGradient } from "@/lib/utils";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export function ChatDrawer({ open, onClose, messages, onSend }: ChatDrawerProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/[0.08] bg-meet-surface/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out sm:max-w-md ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-meet-accent/15">
              <MessageSquare className="h-4 w-4 text-meet-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white">In-call chat</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-meet-hover hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-meet-hover/60">
                <MessageSquare className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-sm text-white/40">No messages yet.</p>
              <p className="text-xs text-white/25">Say hello to everyone!</p>
            </div>
          ) : (
            messages.map((message) => {
              const gradient = getAvatarGradient(message.name);
              return (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${message.isLocal ? "flex-row-reverse" : ""}`}
                >
                  {!message.isLocal && (
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-bold text-white`}
                    >
                      {message.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      message.isLocal
                        ? "rounded-tr-md bg-meet-accent/20"
                        : "rounded-tl-md bg-meet-hover/80"
                    }`}
                  >
                    {!message.isLocal && (
                      <p className="mb-0.5 text-xs font-semibold text-meet-accent">{message.name}</p>
                    )}
                    <p className="text-sm leading-relaxed text-white/90">{message.text}</p>
                    <p className="mt-1 text-[10px] text-white/30">{formatTime(message.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/[0.08] p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Send a message…"
              className="flex-1 rounded-2xl border border-white/10 bg-meet-bg/80 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-meet-accent focus:ring-1 focus:ring-meet-accent/30"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-meet-accent text-gray-900 transition hover:bg-blue-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
