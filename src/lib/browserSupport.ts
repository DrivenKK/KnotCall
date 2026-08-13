export type BrowserFamily =
  | "chrome"
  | "edge"
  | "brave"
  | "opera"
  | "firefox"
  | "safari"
  | "chromium"
  | "unknown";

export interface BrowserInfo {
  family: BrowserFamily;
  label: string;
  isChromium: boolean;
  tips: string[];
}

/** Legacy API shim for older Chromium builds and embedded WebViews. */
export function ensureMediaDevices(): boolean {
  if (typeof navigator === "undefined") return false;

  if (!navigator.mediaDevices) {
    (navigator as Navigator & { mediaDevices: MediaDevices }).mediaDevices =
      {} as MediaDevices;
  }

  if (!navigator.mediaDevices.getUserMedia) {
    const legacyGetUserMedia =
      (
        navigator as Navigator & {
          getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
          webkitGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
        }
      ).getUserMedia ||
      (
        navigator as Navigator & {
          webkitGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
        }
      ).webkitGetUserMedia;

    if (legacyGetUserMedia) {
      navigator.mediaDevices.getUserMedia = (constraints) =>
        new Promise((resolve, reject) => {
          (
            legacyGetUserMedia as (
              constraints: MediaStreamConstraints,
              success: (stream: MediaStream) => void,
              error: (err: unknown) => void
            ) => void
          ).call(navigator, constraints ?? {}, resolve, reject);
        });
    }
  }

  return typeof navigator.mediaDevices?.getUserMedia === "function";
}

export function supportsWebRTC(): boolean {
  if (typeof window === "undefined") return false;
  ensureMediaDevices();
  return (
    typeof RTCPeerConnection !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export async function getBrowserInfo(): Promise<BrowserInfo> {
  if (typeof navigator === "undefined") {
    return { family: "unknown", label: "Unknown", isChromium: false, tips: [] };
  }

  const ua = navigator.userAgent;
  const tips: string[] = [];

  const braveNav = navigator as Navigator & {
    brave?: { isBrave?: () => Promise<boolean> };
  };

  if (braveNav.brave?.isBrave) {
    try {
      if (await braveNav.brave.isBrave()) {
        tips.push(
          "In Brave: allow camera & mic for this site. If video fails, open the lion icon → Shields → set Fingerprinting to Standard for this site."
        );
        return { family: "brave", label: "Brave", isChromium: true, tips };
      }
    } catch {
      /* ignore */
    }
  }

  if (/OPR\/|Opera/i.test(ua)) {
    return { family: "opera", label: "Opera", isChromium: true, tips };
  }

  if (/Edg\//i.test(ua)) {
    return { family: "edge", label: "Edge", isChromium: true, tips };
  }

  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    return { family: "chrome", label: "Chrome", isChromium: true, tips };
  }

  if (/Firefox\//i.test(ua)) {
    return { family: "firefox", label: "Firefox", isChromium: false, tips };
  }

  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    return { family: "safari", label: "Safari", isChromium: false, tips };
  }

  if (/Chromium/i.test(ua)) {
    return { family: "chromium", label: "Chromium", isChromium: true, tips };
  }

  tips.push("Use a recent version of Chrome, Brave, Opera, Edge, Firefox, or Safari.");
  return { family: "unknown", label: "Your browser", isChromium: false, tips };
}

export async function getUserMediaWithFallbacks(
  wantVideo: boolean,
  wantAudio: boolean
): Promise<MediaStream> {
  ensureMediaDevices();

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera or microphone access.");
  }

  const attempts: MediaStreamConstraints[] = [
    {
      video: wantVideo
        ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        : false,
      audio: wantAudio ? { echoCancellation: true, noiseSuppression: true } : false,
    },
    { video: wantVideo, audio: wantAudio },
    { video: wantVideo, audio: false },
    { video: false, audio: wantAudio },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    if (!constraints.video && !constraints.audio) continue;
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to access camera or microphone.");
}

export async function getDisplayMediaWithFallback(): Promise<MediaStream> {
  ensureMediaDevices();

  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen sharing is not supported in this browser.");
  }

  try {
    return await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  } catch {
    return await navigator.mediaDevices.getDisplayMedia({ video: true });
  }
}
