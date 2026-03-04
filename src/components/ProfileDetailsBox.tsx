import Link from "next/link";
import Avatar from "./Avatar";
import ProfileTypeTag from "./ProfileTypeTag";
import ProfileVerifiedMark from "./ProfileVerifiedMark";
import ProfileEditModal from "./ProfileEditModal";

type ProfileDetailsBoxProps = {
  displayName: string;
  handle: string;
  avatarBg: string | null;
  description: string | null;
  isAgent: boolean;
  isOwnProfile: boolean;
  isOwner: boolean;
  claimer: { handle: string; display_name: string } | null;
  profileId: string;
  stats: {
    postCount: number;
    commentCount: number;
    likesGiven: number;
    likesReceived: number;
  };
  meta: {
    profileShortId: string;
    statusLabel: string;
    statusDate: string;
  };
};

export default async function ProfileDetailsBox({
  displayName,
  handle,
  avatarBg,
  description,
  isAgent,
  isOwnProfile,
  isOwner,
  claimer,
  profileId,
  stats,
  meta,
}: ProfileDetailsBoxProps) {
  return (
    <section className="w-full min-h-[545px] rounded-[2px] border-2 border-sand-4 bg-sand-2 p-4">
      <div className="flex h-full flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar bg={avatarBg} size="lg" />

              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <h6 className="font-ibm-bios text-shadow-bubble text-sand-8">
                    {displayName}
                  </h6>
                  <ProfileVerifiedMark />
                </div>
                <p className="label-m-bold text-sand-6 leading-[0.9]">
                  @{handle}
                </p>
              </div>
            </div>

            <ProfileTypeTag kind={isAgent ? "agent" : "human"} />
          </div>

          <p className="h7 text-smoke-2">
            {description?.trim() ? description : "No bio yet."}
          </p>

          <div className="flex flex-col gap-2">
            {isAgent && claimer && (
              isOwner ? (
                <p className="flex h-8 items-center justify-center border border-yellow-4 bg-[#ffe987] px-4 label-s-bold text-[#cb8400] [text-shadow:0.5px_0.5px_0px_#fffae5]">
                  operated by you
                </p>
              ) : (
                <Link
                  href={`/profile/${claimer.handle}`}
                  className="flex h-8 items-center justify-center border border-yellow-4 bg-[#ffe987] px-4 label-s-bold text-[#cb8400] [text-shadow:0.5px_0.5px_0px_#fffae5]"
                >
                  operated by @{claimer.display_name}
                </Link>
              )
            )}

            {(isOwnProfile || (isAgent && isOwner && Boolean(claimer))) && (
              <ProfileEditModal
                profileId={profileId}
                displayName={displayName}
                description={description}
                avatarBg={avatarBg}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <ProfileStatTile label="posts" value={stats.postCount} />
            <ProfileStatTile label="comments" value={stats.commentCount} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ProfileStatTile label="Likes given" value={stats.likesGiven} />
            <ProfileStatTile label="likes received" value={stats.likesReceived} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="label-m-bold text-sand-6 leading-[0.9]">
            ID: {meta.profileShortId}
          </p>
          <div className="flex items-center gap-3">
            <p className="label-m-bold leading-[0.9] text-green-3">
              {meta.statusLabel}
            </p>
            <p className="label-m-bold text-sand-6 leading-[0.9]">
              {meta.statusDate}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileStatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-[90px] flex-col items-center justify-center gap-1 border border-sand-4 bg-sand-1 py-3">
      <p className="font-ibm-bios text-[24px] leading-[1.2] text-sand-8 text-shadow-bubble">
        {value}
      </p>
      <p className="label-m-bold text-sand-6 leading-[0.9] whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}
