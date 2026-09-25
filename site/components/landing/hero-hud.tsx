"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import {
  HUD_CX,
  HUD_CY,
  HUD_H,
  HUD_W,
  hudArc,
  hudBrackets,
  hudPoint,
  hudRuler,
  hudTicks,
  hudWedge,
} from "@/lib/viz/hud";

const STORAGE_KEY = "jarvis-hud-paused";

// Everything below is computed once at module load; the markup is the same on the server and in
// the browser (see lib/viz/hud.ts for why the numbers are rounded).
const TICKS = hudTicks(72, 250, 6, 12, 6);
const OUTER_ARCS = [
  hudArc(-20, 60, 290),
  hudArc(100, 150, 290),
  hudArc(200, 262, 290),
];
const MID_ARCS = [
  hudArc(10, 80, 230),
  hudArc(130, 200, 230),
  hudArc(250, 320, 230),
];
const NODES = [
  hudPoint(-40, 230),
  hudPoint(95, 230),
  hudPoint(205, 230),
  hudPoint(290, 170),
  hudPoint(160, 170),
];
const SWEEP = hudWedge(-38, 0, 290);
const BRACKETS = hudBrackets(40, 30, HUD_W - 80, HUD_H - 60, 30);

/**
 * A faint, slowly turning HUD behind the landing hero: concentric rings, a radar sweep and a
 * horizontal scan line, drawn in the brand colour so both themes are covered by the tokens.
 *
 * It is decoration, so it is `aria-hidden` and takes no pointer events. It is also motion that
 * never ends on its own, which WCAG 2.2.2 requires the reader to be able to stop, hence the
 * pause button. The animation only runs while all of these hold: the reader has not paused it,
 * it is on screen, and the tab is visible. Reduce Motion leaves the static drawing (the global
 * rule in globals.css collapses the keyframes) and hides the button, since nothing moves.
 *
 * Before the client has read the saved choice, and without JavaScript, the drawing is static.
 * That matches what the server rendered, so hydration cannot mismatch.
 */
export function HeroHud({
  pauseLabel,
  playLabel,
}: {
  pauseLabel: string;
  playLabel: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0);
  // null until the saved choice has been read, so the first client render equals the server's.
  const [paused, setPaused] = useState<boolean | null>(null);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    let saved = false;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Storage can be blocked (private window, site data cleared); the default is "playing".
    }
    // Same justified case as hooks/use-reduced-motion.ts: reading client-only state on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaused(saved);
  }, []);

  useEffect(() => {
    const onChange = () =>
      setTabVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const running = paused === false && inView && tabVisible;

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not persisted; the choice still holds for this visit.
    }
  };

  return (
    <>
      <div
        ref={ref}
        aria-hidden="true"
        data-hud-running={running}
        data-testid="hero-hud"
        className="pointer-events-none absolute inset-0 -z-10 text-brand opacity-45 dark:opacity-75 [mask-image:radial-gradient(ellipse_60%_75%_at_50%_50%,#000_30%,transparent_100%)]"
      >
        <svg
          viewBox={`0 0 ${HUD_W} ${HUD_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="size-full"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
        >
          {/* Rings: on every screen size. */}
          <g className="hud-anim hud-spin-slow">
            <circle
              cx={HUD_CX}
              cy={HUD_CY}
              r={110}
              strokeOpacity={0.5}
              strokeDasharray="2 9"
            />
          </g>
          <g className="hud-anim hud-spin-rev">
            <circle
              cx={HUD_CX}
              cy={HUD_CY}
              r={170}
              strokeOpacity={0.45}
              strokeDasharray="34 10 4 10"
            />
          </g>
          <g className="hud-anim hud-spin">
            {MID_ARCS.map((d) => (
              <path key={d} d={d} strokeWidth={1.75} strokeOpacity={0.7} />
            ))}
          </g>
          <circle cx={HUD_CX} cy={HUD_CY} r={290} strokeOpacity={0.3} />

          {/* Scan line: on every screen size. */}
          <rect
            className="hud-anim hud-scan"
            x={0}
            y={0}
            width={HUD_W}
            height={1.5}
            fill="currentColor"
            stroke="none"
          />

          {/* Detail: from the sm breakpoint up. */}
          <g className="hud-detail">
            <g className="hud-anim hud-spin-slower">
              <path d={TICKS.short} strokeOpacity={0.35} />
              <path d={TICKS.long} strokeOpacity={0.6} />
            </g>
            <g className="hud-anim hud-spin-rev-slow">
              {OUTER_ARCS.map((d) => (
                <path key={d} d={d} strokeWidth={2} strokeOpacity={0.55} />
              ))}
            </g>
            <g className="hud-anim hud-sweep">
              <path
                d={SWEEP}
                fill="currentColor"
                fillOpacity={0.09}
                stroke="none"
              />
              <line
                x1={HUD_CX}
                y1={HUD_CY}
                x2={hudPoint(0, 290).x}
                y2={hudPoint(0, 290).y}
                strokeOpacity={0.6}
              />
            </g>
            {NODES.map((p, i) => (
              <circle
                key={`${p.x}-${p.y}`}
                className="hud-anim hud-blink"
                style={{ animationDelay: `${i * 1.3}s` }}
                cx={p.x}
                cy={p.y}
                r={3}
                fill="currentColor"
                stroke="none"
              />
            ))}
            <path d={BRACKETS} strokeOpacity={0.55} />
            <path d={hudRuler(64, 190, 21, 11, 1)} strokeOpacity={0.4} />
            <path
              d={hudRuler(HUD_W - 64, 190, 21, 11, -1)}
              strokeOpacity={0.4}
            />
            <path
              d={`M${HUD_CX - 300} ${HUD_CY}H${140}M${HUD_CX + 300} ${HUD_CY}H${HUD_W - 140}`}
              strokeOpacity={0.35}
              strokeDasharray="1 7"
            />
          </g>
        </svg>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={
          paused === false ? pauseLabel : paused ? playLabel : pauseLabel
        }
        data-testid="hero-hud-toggle"
        className="hud-toggle absolute right-2 bottom-2 z-10 size-8 text-muted-foreground"
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </Button>
    </>
  );
}
