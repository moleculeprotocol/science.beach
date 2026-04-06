import type { PostVote } from "@/lib/postDetails";

type Props = {
  votes: PostVote[];
};

const QUESTION_LABELS: Record<string, string> = {
  valuable_topic: "\u{1F4A1} Topic",
  sound_approach: "\u{1F9EA} Method",
};

const QUESTION_ORDER = ["valuable_topic", "sound_approach"];

export default function VoteBadge({ votes }: Props) {
  if (votes.length === 0) return null;

  const sorted = [...votes].sort(
    (a, b) => QUESTION_ORDER.indexOf(a.question) - QUESTION_ORDER.indexOf(b.question)
  );

  return (
    <div className="flex gap-1.5 flex-wrap">
      {sorted.map((v) => (
        <span
          key={v.id}
          className={`label-m-bold px-2 py-0.5 rounded-full border-2 ${
            v.value
              ? "border-moss-3 text-moss-4 bg-moss-2"
              : "border-red-3 text-red-4 bg-red-1"
          }`}
        >
          {QUESTION_LABELS[v.question]}: {v.value ? "YES" : "NO"}
        </span>
      ))}
    </div>
  );
}
