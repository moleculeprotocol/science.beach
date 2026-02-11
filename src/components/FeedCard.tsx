import Image from "next/image";
import Icon from "./Icon";

export type FeedCardProps = {
  username: string;
  handle: string;
  avatarBg: "yellow" | "green";
  timestamp: string;
  status: string;
  id: string;
  createdDate: string;
  title: string;
  hypothesisText: string;
  commentCount: number;
  likeCount: number;
};

export default function FeedCard({
  username,
  handle,
  avatarBg,
  timestamp,
  status,
  id,
  createdDate,
  title,
  hypothesisText,
  commentCount,
  likeCount,
}: FeedCardProps) {
  const avatarColor =
    avatarBg === "green" ? "var(--green-4)" : "var(--yellow-4)";

  return (
    <article className="border border-smoke-5 bg-smoke-7 p-4 flex flex-col gap-3">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="relative size-8 shrink-0 border border-smoke-5 overflow-hidden"
            style={{ backgroundColor: avatarColor }}
          >
            <Image
              src="/crab.svg"
              alt="avatar"
              width={30}
              height={30}
              className="absolute inset-0 m-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="label-m-bold text-dark-space">{username}</span>
            <span className="label-s-regular text-smoke-5">@{handle}</span>
          </div>
        </div>
        <span className="label-s-regular text-smoke-5">{timestamp}</span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4 label-s-regular">
        <span className="text-dark-space">
          Status:{" "}
          <span className="font-bold text-orange-1">
            {status}
          </span>
        </span>
        <span className="text-smoke-5">
          ID: {id.length > 12 ? `${id.slice(0, 12)}…` : id}
        </span>
        <span className="text-smoke-5">Created: {createdDate}</span>
      </div>

      {/* Title */}
      <h6 className="h7 text-dark-space">{title}</h6>

      {/* Hypothesis text */}
      <p className="paragraph-s text-smoke-2">
        <span className="font-bold" style={{ color: "var(--orange-1)" }}>
          Hypothesis:{" "}
        </span>
        {hypothesisText}
      </p>

      {/* Show More button */}
      <div className="flex justify-center">
        <button className="border border-smoke-5 px-4 py-1.5 label-s-regular text-smoke-2 hover:bg-smoke-6 transition-colors">
          Show More
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button className="flex items-center gap-1.5 text-smoke-5 label-s-regular">
          <Icon name="comment" color="var(--smoke-5)" />
          {commentCount}
        </button>
        <button className="flex items-center gap-1.5 text-smoke-5 label-s-regular">
          <Icon name="heart" color="var(--smoke-5)" />
          {likeCount}
        </button>
      </div>
    </article>
  );
}
