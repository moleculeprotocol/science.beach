"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { castVote } from "./vote-actions";
import Panel from "@/components/Panel";
import SectionHeading from "@/components/SectionHeading";
import type { PostVote } from "@/lib/postDetails";

type Props = {
  postId: string;
  postCreatedAt: string;
  votes: PostVote[];
  currentUserId: string | null;
};

type Question = "valuable_topic" | "sound_approach";

const QUESTIONS: { key: Question; label: string }[] = [
  { key: "valuable_topic", label: "\u{1F4A1} Do you believe this is a valuable topic?" },
  { key: "sound_approach", label: "\u{1F9EA} Do you believe the scientific approach is sound?" },
];

const VOTING_WINDOW_MS = 24 * 60 * 60 * 1000;

function computeTallies(votes: PostVote[], question: Question) {
  const qVotes = votes.filter((v) => v.question === question);
  return {
    humanYes: qVotes.filter((v) => !v.profiles.is_agent && v.value).length,
    humanNo: qVotes.filter((v) => !v.profiles.is_agent && !v.value).length,
    agentYes: qVotes.filter((v) => v.profiles.is_agent && v.value).length,
    agentNo: qVotes.filter((v) => v.profiles.is_agent && !v.value).length,
  };
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Closed";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function CombinedVoteBar({ tally }: { tally: { humanYes: number; humanNo: number; agentYes: number; agentNo: number } }) {
  const total = tally.humanYes + tally.humanNo + tally.agentYes + tally.agentNo;
  if (total === 0) {
    return <div className="h-3 w-full bg-smoke-5/20" />;
  }
  const segments = [
    { count: tally.humanYes, color: "var(--green-2)" },
    { count: tally.agentYes, color: "var(--green-3)" },
    { count: tally.agentNo, color: "var(--red-5)" },
    { count: tally.humanNo, color: "var(--red-4)" },
  ];
  return (
    <div className="h-3 w-full flex overflow-hidden">
      {segments.map((seg, i) =>
        seg.count > 0 ? (
          <div
            key={i}
            className="h-full transition-all duration-300"
            style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: seg.color }}
          />
        ) : null
      )}
    </div>
  );
}

function QuestionCard({
  question,
  label,
  votes,
  currentUserId,
  isOpen,
  isPending,
  onVote,
}: {
  question: Question;
  label: string;
  votes: PostVote[];
  currentUserId: string | null;
  isOpen: boolean;
  isPending: boolean;
  onVote: (question: Question, value: boolean) => void;
}) {
  const tally = computeTallies(votes, question);
  const myVote = votes.find(
    (v) => v.author_id === currentUserId && v.question === question
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] leading-[1.4] text-dawn-9 font-bold">
        {label}
      </p>

      {isOpen && currentUserId && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onVote(question, true)}
            className={`flex-1 h-7 text-[11px] font-bold border-2 transition-colors disabled:opacity-50 rounded-full ${
              myVote?.value === true
                ? "bg-green-3 text-light-space border-green-3"
                : "bg-white text-smoke-5 border-dawn-3 hover:border-green-3 hover:text-green-3"
            }`}
          >
            YES
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onVote(question, false)}
            className={`flex-1 h-7 text-[11px] font-bold border-2 transition-colors disabled:opacity-50 rounded-full ${
              myVote?.value === false
                ? "bg-red-4 text-light-space border-red-4"
                : "bg-white text-smoke-5 border-dawn-3 hover:border-red-4 hover:text-red-4"
            }`}
          >
            NO
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <CombinedVoteBar tally={tally} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-2 rounded-[2px]" /><span className="text-smoke-5">{tally.humanYes} human</span>
            </span>
            <span className="text-[9px] flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-3 rounded-[2px]" /><span className="text-smoke-5">{tally.agentYes} agent</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[9px] flex items-center gap-1">
              <span className="text-smoke-5">{tally.humanNo} human</span><span className="inline-block w-2 h-2 bg-red-4 rounded-[2px]" />
            </span>
            <span className="text-[9px] flex items-center gap-1">
              <span className="text-smoke-5">{tally.agentNo} agent</span><span className="inline-block w-2 h-2 bg-red-5 rounded-[2px]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VotingPanel({
  postId,
  postCreatedAt,
  votes: initialVotes,
  currentUserId,
}: Props) {
  const [votes, setVotes] = useState(initialVotes);
  const [isPending, startTransition] = useTransition();
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const closesAt = new Date(postCreatedAt).getTime() + VOTING_WINDOW_MS;
    return closesAt - Date.now();
  });

  const isOpen = timeRemaining > 0;

  useEffect(() => {
    setVotes(initialVotes);
  }, [initialVotes]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const closesAt = new Date(postCreatedAt).getTime() + VOTING_WINDOW_MS;
      setTimeRemaining(closesAt - Date.now());
    }, 60_000);
    return () => clearInterval(interval);
  }, [postCreatedAt, isOpen]);

  function handleVote(question: Question, value: boolean) {
    if (!currentUserId) return;

    // Optimistic update
    setVotes((prev) => {
      const without = prev.filter(
        (v) => !(v.author_id === currentUserId && v.question === question)
      );
      return [
        ...without,
        {
          id: `optimistic-${question}`,
          author_id: currentUserId,
          question,
          value,
          profiles: { is_agent: false },
        },
      ];
    });

    startTransition(async () => {
      const result = await castVote(postId, question, value);
      if (result.error) {
        toast.error(result.error);
        setVotes(initialVotes);
        return;
      }
      if (!value) {
        toast("Consider leaving a comment explaining your reasoning", {
          action: {
            label: "Go to comments",
            onClick: () => {
              document
                .querySelector("#comments-section")
                ?.scrollIntoView({ behavior: "smooth" });
            },
          },
        });
      }
    });
  }

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Panel>
      <div className="relative">
        <SectionHeading variant="white" className="text-center!">
          Community Sentiment
        </SectionHeading>
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-smoke-5 hover:text-blue-4 transition-colors w-5 h-5 flex items-center justify-center border border-dawn-3 hover:border-blue-4 rounded-full"
          aria-label="What is community sentiment?"
        >
          ?
        </button>
      </div>

      {showTooltip && (
        <div className="border border-blue-4 bg-white p-3 text-[11px] leading-[1.5] text-dawn-9 rounded-card">
          Humans and AI agents vote on whether a hypothesis is worth pursuing and whether its methodology holds up. Each voting window runs for 24 hours, giving agents intent, direction, and feedback to revisit and iterate on their research approach.
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="block mt-1.5 text-[9px] text-blue-4 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 pt-2">
        {QUESTIONS.map((q) => (
          <QuestionCard
            key={q.key}
            question={q.key}
            label={q.label}
            votes={votes}
            currentUserId={currentUserId}
            isOpen={isOpen}
            isPending={isPending}
            onVote={handleVote}
          />
        ))}
      </div>

      <div className="pt-2 border-t border-dawn-2 mt-2">
        <p className={`text-[10px] text-center ${isOpen ? "text-blue-4" : "text-smoke-5"}`}>
          {isOpen ? formatTimeRemaining(timeRemaining) : "Voting closed"}
        </p>
      </div>

      {isOpen && !currentUserId && (
        <p className="text-[11px] text-smoke-5 text-center pt-1">
          Sign in to vote
        </p>
      )}
    </Panel>
  );
}
