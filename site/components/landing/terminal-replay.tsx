"use client";

import { PauseIcon, PlayIcon, RotateCcwIcon, StepForwardIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { replayScript, type ReplayFrame } from "@/lib/content/replay-script";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTAINER } from "@/lib/layout";

const FRAME_DELAY_MS = 2200;

function FrameView({ frame }: { frame: ReplayFrame }) {
  if (frame.kind === "command") {
    return (
      <p>
        <span className="text-muted-foreground">{frame.prompt} </span>
        {frame.text}
      </p>
    );
  }
  return (
    <>
      {frame.lines.map((line, i) => (
        <p key={i} className={line.trim() === "" ? "h-4" : undefined}>
          {line || " "}
        </p>
      ))}
    </>
  );
}

/**
 * A scripted, looping-free terminal replay. Respects prefers-reduced-motion by
 * rendering the full final transcript immediately, with no timer (see useReducedMotion).
 * No ARIA live region on the animated area by design — an autoplaying, updating region
 * announced to screen readers on every frame would be noisy; a plain-text transcript
 * (identical content, no animation) is available on demand instead.
 */
export function TerminalReplay({ dict }: { dict: Dictionary }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  const atEnd = index >= replayScript.length - 1;
  const effectiveIndex = reducedMotion ? replayScript.length - 1 : index;
  const visible = replayScript.slice(0, effectiveIndex + 1);
  const currentFrame = replayScript[Math.min(effectiveIndex, replayScript.length - 1)];
  const caption = currentFrame ? dict.landing.replay.captions[currentFrame.captionKey] : "";

  useEffect(() => {
    if (reducedMotion || !playing || atEnd) return;
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, replayScript.length - 1)), FRAME_DELAY_MS);
    return () => clearTimeout(t);
  }, [playing, atEnd, reducedMotion, index]);

  const transcriptText = useMemo(
    () =>
      replayScript
        .map((f) => (f.kind === "command" ? `${f.prompt} ${f.text}` : f.lines.join("\n")))
        .join("\n\n"),
    [],
  );

  return (
    <section className={cn(CONTAINER, "max-w-4xl py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{dict.landing.replay.heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{dict.landing.replay.subhead}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2">
          {/* Decorative window chrome only — plain neutral dots, not the phase/severity
              indicator tokens (those carry real meaning elsewhere; reusing them here
              for decoration would blur that). */}
          <span aria-hidden="true" className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span aria-hidden="true" className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span aria-hidden="true" className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">jarvis — session</span>
        </div>

        <div
          className="min-h-64 space-y-3 overflow-x-auto bg-code-bg p-4 font-mono text-xs sm:text-sm"
          aria-hidden="true"
        >
          {visible.map((frame, i) => (
            <div key={i} className={cn(i === effectiveIndex && "animate-in fade-in-0 duration-200")}>
              <FrameView frame={frame} />
            </div>
          ))}
        </div>
      </div>

      <p aria-live="off" className="mt-3 min-h-5 text-center text-sm text-muted-foreground">
        {caption}
      </p>

      {!reducedMotion && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? dict.landing.replay.pause : dict.landing.replay.play}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={atEnd}
            onClick={() => {
              setPlaying(false);
              setIndex((i) => Math.min(i + 1, replayScript.length - 1));
            }}
            aria-label={dict.landing.replay.step}
          >
            <StepForwardIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setIndex(0);
              setPlaying(true);
            }}
            aria-label={dict.landing.replay.restart}
          >
            <RotateCcwIcon />
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Button type="button" variant="link" size="sm" onClick={() => setShowTranscript((v) => !v)}>
          {showTranscript ? dict.landing.replay.hideTranscript : dict.landing.replay.showTranscript}
        </Button>
        {showTranscript && (
          // tabIndex: same WCAG 2.1.1/2.1.3 fix as the MDX/config table wrappers, in
          // case a long unbroken line ever forces a real horizontal scroll here.
          <pre
            tabIndex={0}
            className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-left font-mono text-xs whitespace-pre-wrap"
          >
            {transcriptText}
          </pre>
        )}
      </div>
    </section>
  );
}
