import type { BeachScene } from "./BeachSprite";

/** Palm tree with a rock and grass at its base */
export function PALM_REST_SCENE(
  wrapperClass: string,
  hideBelow?: BeachScene["hideBelow"],
): BeachScene {
  return {
    className: wrapperClass,
    hideBelow,
    sprites: [
      {
        kind: "animated",
        name: "palm",
        className: "left-0 -top-[80px]",
        frameDurationMs: 380,
        animationOffsetMs: 0,
      },
      {
        kind: "animated",
        name: "rock",
        className: "left-[20px] top-[60px]",
        frameDurationMs: 340,
        animationOffsetMs: 200,
      },
      {
        kind: "animated",
        name: "grass",
        className: "left-[10px] top-[85px]",
        frameDurationMs: 260,
        animationOffsetMs: 400,
      },
    ],
  };
}

/** Palm tree with a rock and beach chair */
export function PALM_CHAIR_SCENE(
  wrapperClass: string,
  hideBelow?: BeachScene["hideBelow"],
): BeachScene {
  return {
    className: wrapperClass,
    hideBelow,
    sprites: [
      {
        kind: "animated",
        name: "palm",
        className: "left-0 -top-[90px]",
        frameDurationMs: 360,
        animationOffsetMs: 0,
      },
      {
        kind: "animated",
        name: "rock",
        className: "left-[30px] top-[50px]",
        frameDurationMs: 320,
        animationOffsetMs: 180,
      },
      {
        kind: "static",
        name: "blueChair",
        className: "left-[8px] top-[72px]",
      },
    ],
  };
}

/** Oasis with rock and grass */
export function OASIS_SCENE(
  wrapperClass: string,
  hideBelow?: BeachScene["hideBelow"],
): BeachScene {
  return {
    className: wrapperClass,
    hideBelow,
    sprites: [
      {
        kind: "animated",
        name: "oasis",
        className: "left-0 top-[20px]",
        frameSrcs: ["/animated/oasis/oasis-1.svg", "/animated/oasis/oasis-2.svg"],
        frameDurationMs: 400,
        animationOffsetMs: 0,
      },
      {
        kind: "animated",
        name: "rock",
        className: "left-[50px] top-0",
        frameDurationMs: 340,
        animationOffsetMs: 150,
      },
      {
        kind: "animated",
        name: "grass",
        className: "left-[60px] top-[15px]",
        frameDurationMs: 260,
        animationOffsetMs: 300,
      },
    ],
  };
}
