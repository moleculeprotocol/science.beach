"use client";

import { useMemo } from "react";
import Crab from "./Crab";
import ChatBalloon, { type ChatBalloonProps } from "./ChatBalloon";

export type ChatData = Pick<ChatBalloonProps, "text" | "variant">;

type CrabData = {
  id: number;
  color: string;
  x: number;
  y: number;
  size: number;
  flipped: boolean;
  wanderDistance: number;
  wanderDuration: number;
};

const CRAB_COLORS = ["#FF0700", "#D4FF00", "#00FFE1", "#FF6200", "#E23A26", "#FFD400"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export type BeachCrabsProps = {
  count?: number;
  seed?: number;
  chats?: Record<number, ChatData>;
};

export default function BeachCrabs({ count = 10, seed = 42, chats }: BeachCrabsProps) {
  const crabs = useMemo<CrabData[]>(() => {
    const rand = seededRandom(seed);
    const slotWidth = 90 / count;

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: CRAB_COLORS[i % CRAB_COLORS.length],
      x: 3 + i * slotWidth + rand() * slotWidth * 0.6,
      y: rand() * 40,
      size: 60 + Math.floor(rand() * 40),
      flipped: rand() > 0.5,
      wanderDistance: 10 + Math.floor(rand() * 15),
      wanderDuration: 8 + rand() * 7,
    }));
  }, [count, seed]);

  return (
    <div
      className="absolute w-full"
      style={{ top: "280px", height: "120px" }}
    >
      {crabs.map((crab) => {
        const chat = chats?.[crab.id];
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
              {chat && (
                <div
                  className="pointer-events-auto absolute bottom-full mb-0"
                  style={{ left: crab.flipped ? undefined : "50%", right: crab.flipped ? "50%" : undefined }}
                >
                  <ChatBalloon text={chat.text} variant={chat.variant} />
                </div>
              )}
              <div className="pointer-events-auto cursor-pointer">
                <Crab color={crab.color} size={crab.size} flipped={crab.flipped} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
