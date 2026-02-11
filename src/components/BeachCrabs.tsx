"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Crab from "./Crab";
import ChatBalloon, { type ChatBalloonProps } from "./ChatBalloon";
import { CRAB_COLOR_PALETTES } from "./crabColors";
import {
  CRAB_BUBBLE_POOL,
  NEW_CRAB_BUBBLE_LINES,
  ORIGINAL_CRAB_BUBBLE_LINES,
} from "./crabBubbleLines";

export type ChatData = Pick<ChatBalloonProps, "text" | "variant">;

type CrabData = {
  id: number;
  x: number;
  y: number;
  flipped: boolean;
  paletteIndex: number;
  wanderDistance: number;
  wanderDuration: number;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function shuffleIds(ids: number[]) {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type BeachCrabsProps = {
  count?: number;
  seed?: number;
  chats?: Record<number, ChatData>;
  className?: string;
  style?: CSSProperties;
};

export default function BeachCrabs({
  count = 10,
  seed = 42,
  chats,
  className,
  style,
}: BeachCrabsProps) {
  const [activeChats, setActiveChats] = useState<Record<number, ChatData>>(chats ?? {});
  const recentChatTextsRef = useRef<string[]>([]);
  const [speakingIds, setSpeakingIds] = useState<Set<number>>(new Set());
  const lastSpokeCycleRef = useRef<Record<number, number>>({});

  const crabs = useMemo<CrabData[]>(() => {
    const rand = seededRandom(seed);
    const slotWidth = 90 / count;
    const laneStarts = [0, 16, 32, 48];
    const laneJitter = 10;
    let previousLane = -1;
    let laneStreak = 0;

    return Array.from({ length: count }, (_, i) => {
      let lane = Math.floor(rand() * laneStarts.length);

      // Keep lanes mixed so crabs don't form one flat marching line.
      if (lane === previousLane && laneStreak >= 1) {
        lane = (lane + 1 + Math.floor(rand() * (laneStarts.length - 1))) % laneStarts.length;
      }

      if (lane === previousLane) {
        laneStreak += 1;
      } else {
        previousLane = lane;
        laneStreak = 0;
      }

      return {
        id: i,
        x: 3 + i * slotWidth + rand() * slotWidth * 0.6,
        y: laneStarts[lane] + rand() * laneJitter,
        flipped: rand() > 0.5,
        paletteIndex: Math.floor(rand() * CRAB_COLOR_PALETTES.length),
        wanderDistance: 10 + Math.floor(rand() * 15),
        wanderDuration: 8 + rand() * 7,
      };
    });
  }, [count, seed]);

  const chatIds = useMemo(
    () =>
      Object.keys(chats ?? {})
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [chats],
  );

  useEffect(() => {
    const nextChats = chats ?? {};
    setActiveChats(nextChats);
    recentChatTextsRef.current = Object.values(nextChats)
      .map((entry) => entry.text)
      .slice(0, 10);
  }, [chats]);

  useEffect(() => {
    if (chatIds.length === 0) return;

    const cooldownSize = 10;

    const pushRecent = (text: string) => {
      recentChatTextsRef.current = [text, ...recentChatTextsRef.current.filter((t) => t !== text)].slice(
        0,
        cooldownSize,
      );
    };

    const timer = window.setInterval(() => {
      setActiveChats((currentChats) => {
        const targetId = chatIds[Math.floor(Math.random() * chatIds.length)];
        const currentTarget = currentChats[targetId];
        if (!currentTarget) return currentChats;

        const activeTexts = new Set(
          Object.entries(currentChats)
            .filter(([id]) => Number(id) !== targetId)
            .map(([, chat]) => chat.text),
        );
        const cooldownTexts = new Set(recentChatTextsRef.current);

        const preferredPool = Math.random() < 0.5 ? NEW_CRAB_BUBBLE_LINES : ORIGINAL_CRAB_BUBBLE_LINES;
        let candidates = preferredPool.filter(
          (line) => !activeTexts.has(line.text) && !cooldownTexts.has(line.text),
        );
        if (candidates.length === 0) {
          candidates = CRAB_BUBBLE_POOL.filter(
            (line) => !activeTexts.has(line.text) && !cooldownTexts.has(line.text),
          );
        }
        if (candidates.length === 0) {
          candidates = CRAB_BUBBLE_POOL.filter((line) => !activeTexts.has(line.text));
        }
        if (candidates.length === 0) {
          return currentChats;
        }

        const nextLine = candidates[Math.floor(Math.random() * candidates.length)];
        if (!nextLine || nextLine.text === currentTarget.text) {
          return currentChats;
        }

        pushRecent(currentTarget.text);
        pushRecent(nextLine.text);

        return {
          ...currentChats,
          [targetId]: nextLine,
        };
      });
    }, 10000);

    return () => window.clearInterval(timer);
  }, [chatIds]);

  useEffect(() => {
    if (chatIds.length === 0) {
      setSpeakingIds(new Set());
      return;
    }

    const crabById = new Map(crabs.map((crab) => [crab.id, crab]));
    let disposed = false;
    let cycle = 0;
    let clearTimer: number | null = null;
    let nextCycleTimer: number | null = null;

    const isTooClose = (aId: number, bId: number) => {
      const a = crabById.get(aId);
      const b = crabById.get(bId);
      if (!a || !b) return false;

      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      return dx < 16 && dy < 24;
    };

    const runCycle = () => {
      if (disposed) return;
      cycle += 1;

      const candidates = shuffleIds(chatIds);
      const selected: number[] = [];
      const maxSpeakers = Math.max(1, Math.min(3, Math.ceil(chatIds.length / 3)));
      const cooldownCycles = 2;

      for (const id of candidates) {
        if (selected.length >= maxSpeakers) break;

        const lastSpokeAt = lastSpokeCycleRef.current[id] ?? -999;
        if (cycle - lastSpokeAt <= cooldownCycles) continue;
        if (selected.some((chosen) => isTooClose(id, chosen))) continue;
        if (Math.random() > 0.7) continue;

        selected.push(id);
      }

      if (selected.length === 0) {
        for (const id of candidates) {
          const lastSpokeAt = lastSpokeCycleRef.current[id] ?? -999;
          if (cycle - lastSpokeAt <= cooldownCycles) continue;
          if (selected.some((chosen) => isTooClose(id, chosen))) continue;
          selected.push(id);
          break;
        }
      }

      selected.forEach((id) => {
        lastSpokeCycleRef.current[id] = cycle;
      });

      setSpeakingIds(new Set(selected));

      clearTimer = window.setTimeout(() => {
        if (!disposed) {
          setSpeakingIds(new Set());
        }
      }, 4200);

      nextCycleTimer = window.setTimeout(runCycle, 9000);
    };

    runCycle();

    return () => {
      disposed = true;
      if (clearTimer) window.clearTimeout(clearTimer);
      if (nextCycleTimer) window.clearTimeout(nextCycleTimer);
    };
  }, [chatIds, crabs]);

  return (
    <div
      className={className ? `absolute w-full ${className}` : "absolute w-full top-[280px] h-[120px]"}
      style={style}
    >
      {crabs.map((crab) => {
        const chat = activeChats[crab.id];
        const isSpeaking = speakingIds.has(crab.id);
        const wanders = !!chat;
        return (
          <div
            key={crab.id}
            className="absolute"
            style={{
              left: `${crab.x}%`,
              top: `${crab.y}%`,
              ...(wanders
                ? {
                    "--wander-x": `${crab.flipped ? -crab.wanderDistance : crab.wanderDistance}px`,
                    animation: `crab-wander ${crab.wanderDuration.toFixed(1)}s ease-in-out infinite`,
                    animationDelay: `${(crab.id * -1.3).toFixed(1)}s`,
                  }
                : {}),
            } as React.CSSProperties}
          >
            <div className="relative">
              {chat && isSpeaking && (
                <div
                  className="pointer-events-none absolute z-10"
                  style={{
                    bottom: "calc(100% - 18px)",
                    left: crab.flipped ? undefined : "46%",
                    right: crab.flipped ? "46%" : undefined,
                    willChange: "opacity",
                  }}
                >
                  <ChatBalloon
                    text={chat.text}
                    variant={chat.variant}
                    tailSide={crab.flipped ? "right" : "left"}
                  />
                </div>
              )}
              <div className="pointer-events-auto cursor-pointer">
                <Crab
                  flipped={crab.flipped}
                  frameDurationMs={220 + (crab.id % 3) * 55}
                  animationOffsetMs={crab.id * 90}
                  paletteIndex={crab.paletteIndex}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
