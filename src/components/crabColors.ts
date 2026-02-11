export type CrabColorPalette = {
  base: string;
  mid: string;
  dark: string;
  deepest: string;
  accent: string;
};

export const CRAB_COLOR_PALETTES: CrabColorPalette[] = [
  { base: "#FFD400", mid: "#AA9403", dark: "#735A00", deepest: "#3E2B00", accent: "#F6FF4C" },
  { base: "#D4FF00", mid: "#70AA03", dark: "#607300", deepest: "#283E00", accent: "#F6FF4C" },
  { base: "#FF0700", mid: "#AA0E03", dark: "#730E00", deepest: "#3E0800", accent: "#FF514C" },
  { base: "#FF6200", mid: "#AA3803", dark: "#733600", deepest: "#3E1600", accent: "#FF824C" },
  { base: "#FF00C3", mid: "#AA03A5", dark: "#73006B", deepest: "#3E003E", accent: "#FC4CFF" },
  { base: "#00FFE1", mid: "#03AA9F", dark: "#00736A", deepest: "#003E38", accent: "#4CFFFC" },
  { base: "#0051FF", mid: "#1403AA", dark: "#020073", deepest: "#00033E", accent: "#4C5EFF" },
];

export const CRAB_SOURCE_COLORS = {
  base: "#FF0700",
  mid: "#AA0E03",
  dark: "#730E00",
  deepest: "#3E0800",
  accent: "#FF514C",
} as const;
