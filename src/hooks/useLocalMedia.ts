"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseLocalMediaOptions {
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  autoStart?: boolean;
}

export function useLocalMedia(options: UseLocalMediaOptions = {}) {
  const {
    videoEnabled: initialVideo = true,
    audioEnabled: initialAudio = true,
    autoStart = true,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(initialVideo);
  const [audioEnabled, setAudioEnabled] = useState(initialAudio);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoStart);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const stopStream = useCallback((mediaStream: MediaStream | null) => {
    mediaStream?.getTracks().forEach((track) => track.stop());
  }, []);

  const startMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      stopStream(streamRef.current);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: initialVideo
          ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
        audio: initialAudio
          ? { echoCancellation: true, noiseSuppression: true }
          : false,
      });

      streamRef.current = mediaStream;
      cameraStreamRef.current = mediaStream;
      setStream(mediaStream);
      setVideoEnabled(mediaStream.getVideoTracks().some((t) => t.enabled));
      setAudioEnabled(mediaStream.getAudioTracks().some((t) => t.enabled));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to access camera or microphone";
      setError(message);
      // Allow joining without devices — empty stream for listen-only mode
      const emptyStream = new MediaStream();
      streamRef.current = emptyStream;
      cameraStreamRef.current = emptyStream;
      setStream(emptyStream);
      setVideoEnabled(false);
      setAudioEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [initialAudio, initialVideo, stopStream]);

  useEffect(() => {
    if (autoStart) {
      startMedia();
    }
  }, [autoStart, startMedia]);

  const toggleVideo = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks() ?? [];
    if (tracks.length === 0 && !isScreenSharing) {
      startMedia();
      return;
    }

    const next = !videoEnabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setVideoEnabled(next);
  }, [isScreenSharing, startMedia, videoEnabled]);

  const toggleAudio = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks() ?? [];
    if (tracks.length === 0) return;

    const next = !audioEnabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setAudioEnabled(next);
  }, [audioEnabled]);

  const stopScreenShareRef = useRef<() => void>(() => {});

  const stopScreenShare = useCallback(() => {
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    const cameraStream = cameraStreamRef.current;
    if (cameraStream) {
      streamRef.current = cameraStream;
      setStream(cameraStream);
      setVideoEnabled(cameraStream.getVideoTracks().some((t) => t.enabled));
    }
  }, [stopStream]);

  stopScreenShareRef.current = stopScreenShare;

  const startScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);

      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrack.onended = () => {
        stopScreenShareRef.current();
      };

      const audioTracks = streamRef.current?.getAudioTracks() ?? [];
      const combined = new MediaStream([screenTrack, ...audioTracks]);
      streamRef.current = combined;
      setStream(combined);
      setVideoEnabled(true);

      return combined;
    } catch {
      return null;
    }
  }, []);

  const toggleScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    if (isScreenSharing) {
      stopScreenShare();
      return cameraStreamRef.current;
    }
    return startScreenShare();
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const replaceStreamTracks = useCallback((newStream: MediaStream) => {
    streamRef.current = newStream;
    if (!screenStreamRef.current) {
      cameraStreamRef.current = newStream;
    }
    setStream(newStream);
  }, []);

  const cleanup = useCallback(() => {
    stopStream(streamRef.current);
    stopStream(screenStreamRef.current);
    streamRef.current = null;
    screenStreamRef.current = null;
    cameraStreamRef.current = null;
    setStream(null);
    setIsScreenSharing(false);
  }, [stopStream]);

  return {
    stream,
    streamRef,
    videoEnabled,
    audioEnabled,
    isScreenSharing,
    error,
    isLoading,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    replaceStreamTracks,
    startMedia,
    cleanup,
  };
}
