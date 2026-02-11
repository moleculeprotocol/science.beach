export type CrabBubbleLine = {
  text: string;
  variant?: "default" | "short";
};

export const ORIGINAL_CRAB_BUBBLE_LINES: CrabBubbleLine[] = [
  { text: "Sand identified as cozy environment." },
  { text: "Coral reefs are recognized as one of the most vibrant and diverse ecosystems on the planet. They provide a crucial habitat ..." },
  { text: "GIGA", variant: "short" },
  { text: "Has anyone seen my hypothesis?" },
];

export const NEW_CRAB_BUBBLE_LINES: CrabBubbleLine[] = [
  { text: "Control group is just me doing nothing." },
  { text: "My p-value is small, my confidence is huge." },
  { text: "Hypothesis: snacks increase research velocity." },
  { text: "I peer-reviewed this tide. Looks reproducible." },
  { text: "Correlation found. Causation still hiding." },
  { text: "Entropy always wins, but I still publish." },
  { text: "I ran the model. It asked for coffee." },
  { text: "Data first, drama second." },
  { text: "Outlier or genius? Re-run and find out." },
  { text: "My null hypothesis is on vacation." },
  { text: "Lab notes survived the high tide." },
  { text: "Signal detected. Noise is offended." },
  { text: "If uncertain, add error bars." },
  { text: "This beach has excellent sample size." },
  { text: "Calibrated instruments, uncalibrated vibes." },
  { text: "I trust results that fail gracefully." },
  { text: "Bayes says maybe. I say test again." },
  { text: "Grant proposal: one more experiment." },
  { text: "Observed twice. Calling it a trend." },
  { text: "My methods section is waterproof." },
  { text: "Peer review by seagulls is brutal." },
  { text: "I optimize for truth, not applause." },
  { text: "New finding: crabs prefer clean datasets." },
  { text: "Hypothesis passed basic splash checks." },
  { text: "No cherry-picking, only tide-picking." },
  { text: "The baseline moved with the tide." },
  { text: "CI tight, claws tighter." },
  { text: "Replicate, then celebrate." },
  { text: "Science", variant: "short" },
  { text: "Stat sig", variant: "short" },
];

export const CRAB_BUBBLE_POOL: CrabBubbleLine[] = [
  ...ORIGINAL_CRAB_BUBBLE_LINES,
  ...NEW_CRAB_BUBBLE_LINES,
];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildInitialCrabChats(count: number) {
  const clampedCount = Math.max(0, count);
  const originals = shuffle(ORIGINAL_CRAB_BUBBLE_LINES);
  const news = shuffle(NEW_CRAB_BUBBLE_LINES);

  const base: CrabBubbleLine[] = [];
  for (const line of originals) {
    if (base.length >= clampedCount) break;
    base.push(line);
  }

  for (const line of news) {
    if (base.length >= clampedCount) break;
    base.push(line);
  }

  return Object.fromEntries(
    shuffle(base).map((line, id) => [id, line]),
  );
}
