import type Peer from "peerjs";

/** STUN + public TURN relay for cross-network / mobile browser connectivity. */
export const PEER_ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
};

export function createPeerOptions() {
  return {
    debug: 0,
    config: PEER_ICE_CONFIG,
  } as const;
}

export function markRoomHost(roomId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`knotcall-host-${roomId}`, "1");
}

export function shouldAttemptHost(roomId: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`knotcall-host-${roomId}`) === "1";
}

export function clearRoomHost(roomId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`knotcall-host-${roomId}`);
}

/** PeerJS throws if a new Peer is created before the old one fully disconnects. */
export function destroyPeerSafely(peer: Peer | null): Promise<void> {
  return new Promise((resolve) => {
    if (!peer || peer.destroyed) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    peer.once("disconnected", finish);
    peer.once("close", finish);

    try {
      peer.destroy();
    } catch {
      finish();
    }

    setTimeout(finish, 600);
  });
}
