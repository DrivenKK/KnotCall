"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import { nanoid } from "nanoid";
import type { ChatMessage, Participant, SignalingMessage, WaitingRequest } from "@/types";
import { generateParticipantId, getParticipantPeerId, getRoomPeerId } from "@/lib/utils";
import {
  clearRoomHost,
  createPeerOptions,
  destroyPeerSafely,
  shouldAttemptHost,
} from "@/lib/peerConfig";

export type SessionPhase = "idle" | "connecting" | "waiting" | "meeting" | "denied" | "removed";

interface UseRoomSessionOptions {
  roomId: string;
  displayName: string;
  participantId: string;
  localStream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onHostCommand?: (command: "mute" | "video-off" | "mute-all") => void;
}

interface RemotePeerState {
  name: string;
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isSpeaking: boolean;
}

export function createParticipantId(): string {
  return generateParticipantId();
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function useRoomSession({
  roomId,
  displayName,
  participantId,
  localStream,
  videoEnabled,
  audioEnabled,
  onHostCommand,
}: UseRoomSessionOptions) {
  const hostPeerId = getRoomPeerId(roomId);
  const guestPeerId = getParticipantPeerId(roomId, participantId);

  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [waitingRequests, setWaitingRequests] = useState<WaitingRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState<string | null>(null);

  const onHostCommandRef = useRef(onHostCommand);
  onHostCommandRef.current = onHostCommand;

  const peerRef = useRef<Peer | null>(null);
  const myPeerIdRef = useRef("");
  const isHostRef = useRef(false);
  const remotePeersRef = useRef<Map<string, RemotePeerState>>(new Map());
  const callsRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnsRef = useRef<Map<string, DataConnection>>(new Map());
  const admittedPeerIdsRef = useRef<Set<string>>(new Set());
  const waitingNamesRef = useRef<Map<string, string>>(new Map());
  const hostConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef(localStream);
  const displayNameRef = useRef(displayName);
  const videoEnabledRef = useRef(videoEnabled);
  const audioEnabledRef = useRef(audioEnabled);
  const phaseRef = useRef<SessionPhase>("idle");
  const callPeerRef = useRef<(peerId: string) => void>(() => {});
  const connectDataToPeerRef = useRef<(peerId: string, onOpen?: () => void) => void>(() => {});
  const announceJoinRef = useRef<() => void>(() => {});
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectHostPendingRef = useRef(false);
  const intentionalLeaveRef = useRef(false);
  const joinLockRef = useRef(false);

  const resetPeerState = useCallback(() => {
    callsRef.current.forEach((call) => call.close());
    callsRef.current.clear();
    dataConnsRef.current.forEach((conn) => conn.close());
    dataConnsRef.current.clear();
    remotePeersRef.current.clear();
    admittedPeerIdsRef.current.clear();
    waitingNamesRef.current.clear();
    hostConnRef.current = null;
    connectHostPendingRef.current = false;
    setWaitingRequests([]);
    setParticipants([]);
  }, []);

  localStreamRef.current = localStream;
  displayNameRef.current = displayName;
  videoEnabledRef.current = videoEnabled;
  audioEnabledRef.current = audioEnabled;
  phaseRef.current = phase;

  const buildParticipants = useCallback((): Participant[] => {
    const remotes: Participant[] = Array.from(remotePeersRef.current.entries()).map(
      ([peerId, peer]) => ({
        peerId,
        name: peer.name,
        stream: peer.stream,
        isLocal: false,
        isHost: peerId === hostPeerId,
        videoEnabled: peer.videoEnabled,
        audioEnabled: peer.audioEnabled,
        isSpeaking: peer.isSpeaking,
      })
    );

    const local: Participant = {
      peerId: myPeerIdRef.current,
      name: displayNameRef.current || "You",
      stream: localStreamRef.current,
      isLocal: true,
      isHost: isHostRef.current,
      videoEnabled: videoEnabledRef.current,
      audioEnabled: audioEnabledRef.current,
      isSpeaking: false,
    };

    return [local, ...remotes].sort((a, b) => {
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [hostPeerId]);

  const syncParticipants = useCallback(() => {
    setParticipants(buildParticipants());
  }, [buildParticipants]);

  const sendToPeer = useCallback((peerId: string, message: SignalingMessage) => {
    const conn = dataConnsRef.current.get(peerId);
    if (conn?.open) conn.send(message);
  }, []);

  const broadcastToAll = useCallback((message: SignalingMessage, excludeId?: string) => {
    dataConnsRef.current.forEach((conn, peerId) => {
      if (peerId !== excludeId && conn.open) conn.send(message);
    });
  }, []);

  const sendToHost = useCallback(
    (message: SignalingMessage) => sendToPeer(hostPeerId, message),
    [hostPeerId, sendToPeer]
  );

  const upsertRemotePeer = useCallback(
    (peerId: string, patch: Partial<RemotePeerState> & { name?: string }) => {
      const existing = remotePeersRef.current.get(peerId);
      const defaultName = peerId === hostPeerId ? "Host" : "Guest";
      remotePeersRef.current.set(peerId, {
        name: patch.name ?? existing?.name ?? defaultName,
        stream: patch.stream !== undefined ? patch.stream : (existing?.stream ?? null),
        videoEnabled: patch.videoEnabled ?? existing?.videoEnabled ?? true,
        audioEnabled: patch.audioEnabled ?? existing?.audioEnabled ?? true,
        isSpeaking: patch.isSpeaking ?? existing?.isSpeaking ?? false,
      });
    },
    [hostPeerId]
  );

  const sendHostInfo = useCallback(
    (peerId: string) => {
      if (!isHostRef.current) return;
      sendToPeer(peerId, {
        type: "host-info",
        id: hostPeerId,
        name: displayNameRef.current || "Host",
      });
    },
    [hostPeerId, sendToPeer]
  );

  const sendPeerListTo = useCallback(
    (peerId: string) => {
      sendToPeer(peerId, {
        type: "peer-list",
        peers: Array.from(remotePeersRef.current.entries()).map(([id, peer]) => ({
          id,
          name: peer.name,
        })),
      });
    },
    [sendToPeer]
  );

  const handleSignalingMessageRef = useRef<(message: SignalingMessage) => void>(() => {});

  const setupDataConnection = useCallback((conn: DataConnection) => {
    const existing = dataConnsRef.current.get(conn.peer);
    if (existing && existing !== conn) {
      existing.close();
      dataConnsRef.current.delete(conn.peer);
    }
    if (existing?.open && existing === conn) return;

    dataConnsRef.current.set(conn.peer, conn);

    conn.on("data", (data) => {
      handleSignalingMessageRef.current(data as SignalingMessage);
    });

    conn.on("close", () => {
      dataConnsRef.current.delete(conn.peer);
      if (isHostRef.current) {
        setWaitingRequests((prev) => prev.filter((r) => r.id !== conn.peer));
      }
    });
  }, []);

  const connectDataToPeer = useCallback(
    (peerId: string, onOpen?: () => void) => {
      const peer = peerRef.current;
      if (!peer || peerId === myPeerIdRef.current) return;

      const existing = dataConnsRef.current.get(peerId);
      if (existing?.open) {
        onOpen?.();
        return;
      }
      if (existing) {
        existing.close();
        dataConnsRef.current.delete(peerId);
      }

      const conn = peer.connect(peerId, { reliable: true });
      setupDataConnection(conn);
      if (onOpen) conn.on("open", onOpen);
    },
    [setupDataConnection]
  );

  const callPeer = useCallback(
    (peerId: string) => {
      const peer = peerRef.current;
      const stream = localStreamRef.current ?? new MediaStream();
      if (!peer || peerId === myPeerIdRef.current) return;

      if (
        isHostRef.current &&
        peerId !== hostPeerId &&
        !admittedPeerIdsRef.current.has(peerId)
      ) {
        return;
      }

      const existingCall = callsRef.current.get(peerId);
      if (existingCall?.open) return;
      if (existingCall) {
        existingCall.close();
        callsRef.current.delete(peerId);
      }

      const call = peer.call(peerId, stream);
      if (!call) return;

      callsRef.current.set(peerId, call);

      call.on("stream", (remoteStream) => {
        const name =
          waitingNamesRef.current.get(peerId) ??
          (peerId === hostPeerId ? "Host" : "Guest");
        upsertRemotePeer(peerId, { stream: remoteStream, name });
        syncParticipants();
      });

      call.on("close", () => callsRef.current.delete(peerId));
      call.on("error", () => callsRef.current.delete(peerId));
    },
    [hostPeerId, syncParticipants, upsertRemotePeer]
  );

  connectDataToPeerRef.current = connectDataToPeer;
  callPeerRef.current = callPeer;

  const handlePeerJoined = useCallback(
    (message: Extract<SignalingMessage, { type: "peer-joined" }>) => {
      if (message.id === myPeerIdRef.current) return;
      if (isHostRef.current && !admittedPeerIdsRef.current.has(message.id)) return;

      const name = waitingNamesRef.current.get(message.id) ?? message.name;
      waitingNamesRef.current.delete(message.id);

      upsertRemotePeer(message.id, { name });
      syncParticipants();
      connectDataToPeerRef.current(message.id);
      callPeerRef.current(message.id);

      if (isHostRef.current) {
        broadcastToAll(message, message.id);
        sendHostInfo(message.id);
        sendPeerListTo(message.id);
      }
    },
    [broadcastToAll, sendHostInfo, sendPeerListTo, syncParticipants, upsertRemotePeer]
  );

  const handleSignalingMessage = useCallback(
    (message: SignalingMessage) => {
      switch (message.type) {
        case "chat": {
          if (message.from === myPeerIdRef.current) return;
          setChatMessages((prev) => [
            ...prev,
            {
              id: nanoid(),
              from: message.from,
              name: message.name,
              text: message.text,
              timestamp: message.timestamp,
              isLocal: false,
            },
          ]);
          break;
        }
        case "media-state": {
          upsertRemotePeer(message.id, {
            videoEnabled: message.video,
            audioEnabled: message.audio,
          });
          syncParticipants();
          break;
        }
        case "host-info": {
          upsertRemotePeer(message.id, { name: message.name });
          syncParticipants();
          break;
        }
        case "join-request": {
          if (!isHostRef.current) break;
          waitingNamesRef.current.set(message.id, message.name);
          setWaitingRequests((prev) => {
            if (prev.some((r) => r.id === message.id)) return prev;
            return [...prev, { id: message.id, name: message.name, requestedAt: Date.now() }];
          });
          break;
        }
        case "join-admitted": {
          if (message.id !== myPeerIdRef.current) break;
          if (retryTimerRef.current) clearInterval(retryTimerRef.current);
          setPhase("meeting");
          phaseRef.current = "meeting";
          admittedPeerIdsRef.current.add(myPeerIdRef.current);
          connectToHostRef.current();
          break;
        }
        case "join-denied": {
          if (message.id !== myPeerIdRef.current) break;
          setDenyReason(message.reason ?? "The host denied your request to join.");
          setPhase("denied");
          phaseRef.current = "denied";
          break;
        }
        case "host-command": {
          if (message.command === "mute-all") {
            if (message.targetId !== myPeerIdRef.current) break;
            onHostCommandRef.current?.("mute-all");
            break;
          }
          if (message.targetId !== myPeerIdRef.current) break;
          if (message.command === "remove") {
            setRemoveReason(message.reason ?? "The host removed you from the meeting.");
            setPhase("removed");
            phaseRef.current = "removed";
            if (retryTimerRef.current) clearInterval(retryTimerRef.current);
            callsRef.current.forEach((call) => call.close());
            dataConnsRef.current.forEach((conn) => conn.close());
            void destroyPeerSafely(peerRef.current);
            peerRef.current = null;
            break;
          }
          onHostCommandRef.current?.(message.command);
          break;
        }
        case "peer-joined":
          handlePeerJoined(message);
          break;
        case "peer-left": {
          callsRef.current.get(message.id)?.close();
          callsRef.current.delete(message.id);
          dataConnsRef.current.get(message.id)?.close();
          dataConnsRef.current.delete(message.id);
          remotePeersRef.current.delete(message.id);
          admittedPeerIdsRef.current.delete(message.id);
          waitingNamesRef.current.delete(message.id);
          setWaitingRequests((prev) => prev.filter((r) => r.id !== message.id));
          syncParticipants();
          break;
        }
        case "peer-list": {
          message.peers.forEach((peer) => {
            if (peer.id === myPeerIdRef.current) return;
            upsertRemotePeer(peer.id, { name: peer.name });
            connectDataToPeerRef.current(peer.id);
            callPeerRef.current(peer.id);
          });
          syncParticipants();
          break;
        }
      }
    },
    [handlePeerJoined, syncParticipants, upsertRemotePeer]
  );

  handleSignalingMessageRef.current = handleSignalingMessage;

  const answerCall = useCallback(
    (call: MediaConnection) => {
      if (
        isHostRef.current &&
        call.peer !== hostPeerId &&
        !admittedPeerIdsRef.current.has(call.peer)
      ) {
        call.close();
        return;
      }

      const stream = localStreamRef.current ?? new MediaStream();
      call.answer(stream);
      callsRef.current.set(call.peer, call);

      const peerName =
        waitingNamesRef.current.get(call.peer) ??
        (call.peer === hostPeerId ? "Host" : "Guest");

      call.on("stream", (remoteStream) => {
        upsertRemotePeer(call.peer, { stream: remoteStream, name: peerName });
        syncParticipants();
      });

      call.on("close", () => callsRef.current.delete(call.peer));

      if (isHostRef.current && call.peer !== hostPeerId) {
        sendHostInfo(call.peer);
        sendPeerListTo(call.peer);
      }
    },
    [hostPeerId, sendHostInfo, sendPeerListTo, syncParticipants, upsertRemotePeer]
  );

  const connectToHostRef = useRef<() => void>(() => {});

  const announceJoin = useCallback(() => {
    const joinMessage: SignalingMessage = {
      type: "peer-joined",
      id: myPeerIdRef.current,
      name: displayNameRef.current || "Guest",
    };
    sendToHost(joinMessage);
    broadcastToAll(joinMessage);
  }, [broadcastToAll, sendToHost]);

  announceJoinRef.current = announceJoin;

  const connectToHost = useCallback(() => {
    const existing = dataConnsRef.current.get(hostPeerId);
    if (existing?.open) {
      announceJoinRef.current();
      return;
    }
    if (connectHostPendingRef.current) return;
    connectHostPendingRef.current = true;

    callPeerRef.current(hostPeerId);
    connectDataToPeerRef.current(hostPeerId, () => {
      connectHostPendingRef.current = false;
      announceJoinRef.current();
    });
  }, [hostPeerId]);

  connectToHostRef.current = connectToHost;

  const sendJoinRequest = useCallback(() => {
    const send = () => {
      const conn = hostConnRef.current;
      if (!conn?.open) return false;
      conn.send({
        type: "join-request",
        id: myPeerIdRef.current,
        name: displayNameRef.current || "Guest",
      } satisfies SignalingMessage);
      return true;
    };

    if (send()) return;

    const peer = peerRef.current;
    if (!peer) return;

    if (hostConnRef.current && !hostConnRef.current.open) {
      hostConnRef.current.close();
      hostConnRef.current = null;
    }

    const conn = peer.connect(hostPeerId, { reliable: true });
    hostConnRef.current = conn;
    setupDataConnection(conn);
    conn.on("open", () => {
      send();
    });
  }, [hostPeerId, setupDataConnection]);

  const startGuestPeer = useCallback(
    (peer: Peer) => {
      const connectTimeout = setTimeout(() => {
        if (phaseRef.current === "waiting" && !peer.open) {
          setConnectionError(
            "Could not reach the meeting server. Check your connection and tap Try again."
          );
          setIsConnected(false);
        }
      }, 12000);

      peer.on("open", () => {
        clearTimeout(connectTimeout);
        setIsConnected(true);
        setConnectionError(null);
        setPhase("waiting");
        phaseRef.current = "waiting";
        sendJoinRequest();

        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
        retryTimerRef.current = setInterval(() => {
          if (phaseRef.current !== "waiting") {
            if (retryTimerRef.current) clearInterval(retryTimerRef.current);
            return;
          }
          sendJoinRequest();
        }, 5000);
      });

      peer.on("connection", setupDataConnection);
      peer.on("call", answerCall);
      peer.on("disconnected", () => {
        if (phaseRef.current === "waiting" || phaseRef.current === "meeting") {
          setConnectionError("Lost connection to the meeting server. Tap Try again.");
          setIsConnected(false);
        }
      });
      peer.on("error", (err) => {
        clearTimeout(connectTimeout);
        if (err.type === "unavailable-id") return;
        setConnectionError(err.message || "Could not connect to the meeting.");
      });
    },
    [answerCall, sendJoinRequest, setupDataConnection]
  );

  const createGuestPeer = useCallback(async () => {
    await destroyPeerSafely(peerRef.current);
    peerRef.current = null;
    hostConnRef.current = null;

    myPeerIdRef.current = guestPeerId;
    isHostRef.current = false;
    setIsHost(false);
    setPhase("waiting");
    phaseRef.current = "waiting";
    syncParticipants();

    const guestPeer = new Peer(guestPeerId, createPeerOptions());
    peerRef.current = guestPeer;
    startGuestPeer(guestPeer);
  }, [guestPeerId, startGuestPeer, syncParticipants]);

  const reconnectGuest = useCallback(async () => {
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    setConnectionError(null);
    setDenyReason(null);
    resetPeerState();
    await createGuestPeer();
  }, [createGuestPeer, resetPeerState]);

  const claimHostPeer = useCallback(async (): Promise<boolean> => {
    await destroyPeerSafely(peerRef.current);
    peerRef.current = null;

    return new Promise((resolve) => {
      let settled = false;
      const finish = (success: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (!success) {
          void destroyPeerSafely(peerRef.current);
          peerRef.current = null;
        }
        resolve(success);
      };

      const timeout = setTimeout(() => finish(false), 8000);

      myPeerIdRef.current = hostPeerId;
      const hostPeer = new Peer(hostPeerId, createPeerOptions());
      peerRef.current = hostPeer;

      hostPeer.on("open", () => {
        isHostRef.current = true;
        setIsHost(true);
        setIsConnected(true);
        setConnectionError(null);
        setPhase("meeting");
        phaseRef.current = "meeting";
        syncParticipants();
        finish(true);
      });

      hostPeer.on("connection", setupDataConnection);
      hostPeer.on("call", answerCall);
      hostPeer.on("disconnected", () => {
        if (phaseRef.current === "meeting") {
          setConnectionError("Lost connection to the meeting server. Tap Try again.");
          setIsConnected(false);
        }
      });
      hostPeer.on("error", (err) => {
        if (settled) {
          if (err.type !== "unavailable-id") {
            setConnectionError(err.message || "Could not connect to the meeting.");
          }
          return;
        }
        if (err.type === "unavailable-id") finish(false);
        else {
          setConnectionError(err.message || "Could not connect to the meeting.");
          finish(false);
        }
      });
    });
  }, [answerCall, hostPeerId, setupDataConnection, syncParticipants]);

  const join = useCallback(
    async (name?: string) => {
      if (joinLockRef.current) return;
      if (phaseRef.current !== "idle" && peerRef.current) return;

      joinLockRef.current = true;
      if (name) displayNameRef.current = name;

      intentionalLeaveRef.current = false;
      const attemptHost = shouldAttemptHost(roomId);

      try {
        if (!attemptHost) {
          myPeerIdRef.current = guestPeerId;
          isHostRef.current = false;
          setIsHost(false);
          setPhase("waiting");
          phaseRef.current = "waiting";
          syncParticipants();
          await createGuestPeer();
          return;
        }

        // Host: show meeting UI immediately, claim peer ID in background
        myPeerIdRef.current = hostPeerId;
        isHostRef.current = true;
        setIsHost(true);
        setIsConnected(false);
        setPhase("meeting");
        phaseRef.current = "meeting";
        syncParticipants();

        for (let attempt = 0; attempt < 3; attempt++) {
          if (await claimHostPeer()) return;
          await sleep(600 * (attempt + 1));
        }

        clearRoomHost(roomId);
        isHostRef.current = false;
        setIsHost(false);
        await createGuestPeer();
      } catch {
        setConnectionError("Failed to join. Tap Try again.");
        phaseRef.current = "idle";
        setPhase("idle");
        joinLockRef.current = false;
      }
    },
    [roomId, hostPeerId, guestPeerId, claimHostPeer, createGuestPeer, syncParticipants]
  );

  const retryConnection = useCallback(async () => {
    joinLockRef.current = false;
    phaseRef.current = "idle";
    setPhase("idle");
    resetPeerState();
    void destroyPeerSafely(peerRef.current);
    peerRef.current = null;

    if (shouldAttemptHost(roomId)) {
      await join(displayNameRef.current);
    } else {
      await reconnectGuest();
    }
  }, [join, reconnectGuest, resetPeerState, roomId]);

  useEffect(() => {
    const handlePageHide = () => {
      if (intentionalLeaveRef.current || !peerRef.current) return;

      const leaveMessage: SignalingMessage = {
        type: "peer-left",
        id: myPeerIdRef.current,
      };
      broadcastToAll(leaveMessage);
      sendToHost(leaveMessage);
      peerRef.current?.destroy();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [broadcastToAll, sendToHost]);

  useEffect(() => {
    syncParticipants();
  }, [localStream, videoEnabled, audioEnabled, displayName, syncParticipants]);

  useEffect(() => {
    if (phase !== "meeting" || !localStream) return;

    callsRef.current.forEach((call) => {
      const senders = call.peerConnection.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) void sender.replaceTrack(track);
        else call.peerConnection.addTrack(track, localStream);
      });
    });
  }, [phase, localStream]);

  useEffect(() => {
    if (phase !== "meeting") return;

    const message: SignalingMessage = {
      type: "media-state",
      id: myPeerIdRef.current,
      video: videoEnabled,
      audio: audioEnabled,
    };
    broadcastToAll(message);
    sendToHost(message);
  }, [videoEnabled, audioEnabled, phase, broadcastToAll, sendToHost]);

  const admitParticipant = useCallback(
    (peerId: string) => {
      if (!isHostRef.current) return;

      admittedPeerIdsRef.current.add(peerId);
      sendToPeer(peerId, { type: "join-admitted", id: peerId });
      setWaitingRequests((prev) => prev.filter((r) => r.id !== peerId));

      setTimeout(() => {
        connectDataToPeerRef.current(peerId);
        callPeerRef.current(peerId);
      }, 300);
    },
    [sendToPeer]
  );

  const denyParticipant = useCallback(
    (peerId: string) => {
      if (!isHostRef.current) return;

      sendToPeer(peerId, {
        type: "join-denied",
        id: peerId,
        reason: "The host is not ready to let you in.",
      });

      setWaitingRequests((prev) => prev.filter((r) => r.id !== peerId));
      waitingNamesRef.current.delete(peerId);

      setTimeout(() => {
        dataConnsRef.current.get(peerId)?.close();
      }, 500);
    },
    [sendToPeer]
  );

  const admitAll = useCallback(() => {
    waitingRequests.forEach((request) => admitParticipant(request.id));
  }, [admitParticipant, waitingRequests]);

  const ejectParticipant = useCallback(
    (peerId: string) => {
      if (!isHostRef.current || peerId === myPeerIdRef.current || peerId === hostPeerId) return;

      sendToPeer(peerId, {
        type: "host-command",
        command: "remove",
        targetId: peerId,
        reason: "The host removed you from the meeting.",
      });

      callsRef.current.get(peerId)?.close();
      callsRef.current.delete(peerId);
      dataConnsRef.current.get(peerId)?.close();
      dataConnsRef.current.delete(peerId);
      remotePeersRef.current.delete(peerId);
      admittedPeerIdsRef.current.delete(peerId);
      waitingNamesRef.current.delete(peerId);
      setWaitingRequests((prev) => prev.filter((r) => r.id !== peerId));

      broadcastToAll({ type: "peer-left", id: peerId });
      syncParticipants();
    },
    [broadcastToAll, hostPeerId, sendToPeer, syncParticipants]
  );

  const sendHostCommand = useCallback(
    (peerId: string, command: "mute" | "video-off") => {
      if (!isHostRef.current || peerId === myPeerIdRef.current) return;

      sendToPeer(peerId, {
        type: "host-command",
        command,
        targetId: peerId,
      });

      if (command === "mute") {
        upsertRemotePeer(peerId, { audioEnabled: false });
      } else {
        upsertRemotePeer(peerId, { videoEnabled: false });
      }
      syncParticipants();
    },
    [sendToPeer, syncParticipants, upsertRemotePeer]
  );

  const muteParticipant = useCallback(
    (peerId: string) => sendHostCommand(peerId, "mute"),
    [sendHostCommand]
  );

  const disableParticipantVideo = useCallback(
    (peerId: string) => sendHostCommand(peerId, "video-off"),
    [sendHostCommand]
  );

  const muteAllParticipants = useCallback(() => {
    if (!isHostRef.current) return;

    remotePeersRef.current.forEach((_, peerId) => {
      if (peerId === hostPeerId) return;
      sendToPeer(peerId, {
        type: "host-command",
        command: "mute-all",
        targetId: peerId,
      });
      upsertRemotePeer(peerId, { audioEnabled: false });
    });
    syncParticipants();
  }, [hostPeerId, sendToPeer, syncParticipants, upsertRemotePeer]);

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const message: SignalingMessage = {
        type: "chat",
        from: myPeerIdRef.current,
        name: displayNameRef.current || "You",
        text: trimmed,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          from: message.from,
          name: message.name,
          text: message.text,
          timestamp: message.timestamp,
          isLocal: true,
        },
      ]);

      broadcastToAll(message);
      sendToHost(message);
    },
    [broadcastToAll, sendToHost]
  );

  const setParticipantSpeaking = useCallback((peerId: string, speaking: boolean) => {
    if (peerId === myPeerIdRef.current) {
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, isSpeaking: speaking } : p))
      );
      return;
    }

    const peer = remotePeersRef.current.get(peerId);
    if (!peer || peer.isSpeaking === speaking) return;

    remotePeersRef.current.set(peerId, { ...peer, isSpeaking: speaking });
    setParticipants((prev) =>
      prev.map((p) => (p.peerId === peerId ? { ...p, isSpeaking: speaking } : p))
    );
  }, []);

  const replaceOutgoingTracks = useCallback(
    (newStream: MediaStream) => {
      localStreamRef.current = newStream;
      callsRef.current.forEach((call) => {
        const senders = call.peerConnection.getSenders();
        newStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) void sender.replaceTrack(track);
          else call.peerConnection.addTrack(track, newStream);
        });
      });
      syncParticipants();
    },
    [syncParticipants]
  );

  const disconnect = useCallback(() => {
    intentionalLeaveRef.current = true;
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);

    const leaveMessage: SignalingMessage = {
      type: "peer-left",
      id: myPeerIdRef.current,
    };
    broadcastToAll(leaveMessage);
    sendToHost(leaveMessage);

    resetPeerState();
    void destroyPeerSafely(peerRef.current);
    peerRef.current = null;
    phaseRef.current = "idle";
    setPhase("idle");
    setIsConnected(false);
    joinLockRef.current = false;
    clearRoomHost(roomId);
  }, [broadcastToAll, resetPeerState, roomId, sendToHost]);

  return {
    phase,
    join,
    participants,
    chatMessages,
    waitingRequests,
    isConnected,
    isHost,
    connectionError,
    denyReason,
    removeReason,
    sendChatMessage,
    setParticipantSpeaking,
    replaceOutgoingTracks,
    admitParticipant,
    denyParticipant,
    admitAll,
    muteParticipant,
    disableParticipantVideo,
    muteAllParticipants,
    ejectParticipant,
    disconnect,
    retryKnock: retryConnection,
  };
}
