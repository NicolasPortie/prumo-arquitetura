import { useEffect, type RefObject } from "react";
import { VIDEO_FRAME_EPS, VIDEO_SCRUB_LERP } from "../lib/config";

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>;
  progressRef: RefObject<number>;
  holdTail: number;
  reduced: boolean;
  onReady?: () => void;
};

/**
 * Scroll-linked scrub. The video stays paused and never loops.
 * Seeking to `duration` wraps to frame 0 in some browsers, so we clamp to
 * the last paintable frame. The hold tail keeps that frame while Practice
 * is about to enter.
 */
export function useVideoScrub({
  videoRef,
  progressRef,
  holdTail,
  reduced,
  onReady,
}: Options) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.loop = false;
    video.pause();

    let duration = 0;
    let displayTime = 0;
    let primed = false;
    let raf = 0;
    let running = true;
    let pendingTime: number | null = null;

    const lastTime = () => {
      if (duration <= 0) return 0;
      return Math.max(0, duration - Math.max(VIDEO_FRAME_EPS * 2, 1 / 24));
    };

    const mappedTime = () => {
      const span = Math.max(0.001, 1 - holdTail);
      const p = Math.min(1, Math.max(0, progressRef.current / span));
      return p * lastTime();
    };

    const seekTo = (time: number) => {
      const clamped = Math.min(Math.max(0, time), lastTime());
      if (video.seeking) {
        pendingTime = clamped;
        return;
      }
      if (Math.abs(video.currentTime - clamped) < VIDEO_FRAME_EPS) return;
      try {
        video.currentTime = clamped;
      } catch {
        pendingTime = clamped;
      }
    };

    const onSeeked = () => {
      if (pendingTime === null) return;
      const time = pendingTime;
      pendingTime = null;
      seekTo(time);
    };

    const onEnded = () => {
      video.pause();
      seekTo(lastTime());
    };

    const primeDecoder = async () => {
      if (primed) return;
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      try {
        await video.play();
      } catch {
        /* autoplay lock: first user scroll still primes in most browsers */
      }
      video.pause();
      video.loop = false;
      video.currentTime = 0;
      displayTime = 0;
      primed = true;
      onReady?.();
    };

    const onMeta = () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      void primeDecoder();
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      if (!primed || duration <= 0) return;

      const target = mappedTime();
      if (Math.abs(target - displayTime) > 0.2) {
        displayTime = target;
      } else {
        displayTime += (target - displayTime) * VIDEO_SCRUB_LERP;
        if (Math.abs(target - displayTime) < VIDEO_FRAME_EPS) {
          displayTime = target;
        }
      }

      seekTo(displayTime);
    };

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);
    if (video.readyState >= 1) onMeta();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
      video.pause();
    };
  }, [holdTail, onReady, progressRef, reduced, videoRef]);
}
