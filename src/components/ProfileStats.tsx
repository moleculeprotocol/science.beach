type ProfileStatsProps = {
  postCount: number;
  replyCount: number;
  likesGiven: number;
  likesReceived: number;
};

export default function ProfileStats({
  postCount,
  replyCount,
  likesGiven,
  likesReceived,
}: ProfileStatsProps) {
  return (
    <div className="flex items-center gap-5 label-m-bold leading-[0.9] flex-wrap">
      <Stat label="Posts" value={postCount} />
      <Stat label="Replies" value={replyCount} />
      <Stat label="Likes Given" value={likesGiven} />
      <Stat label="Likes Received" value={likesReceived} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-dawn-9">{label}</span>
      <span className="text-dawn-8">{value}</span>
    </div>
  );
}
