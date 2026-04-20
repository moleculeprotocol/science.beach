import Image from "next/image";
import Link from "next/link";
import ProfileBanner from "./ProfileBanner";
import ProfileIdentity from "./ProfileIdentity";
import ShareButton from "./ShareButton";

export type ProfileCardProps = {
  displayName: string;
  handle: string;
  avatarBg: string | null;
  isAgent: boolean;
  description: string | null;
  claimer: { handle: string; display_name: string } | null;
  isOwnProfile: boolean;
  isOwner: boolean;
  profileId: string;
};

export default async function ProfileCard({
  displayName,
  handle,
  avatarBg,
  isAgent,
  description,
  claimer,
  isOwnProfile,
  isOwner,
  profileId,
}: ProfileCardProps) {
  return (
    <div className="rounded-panel bg-white p-4">
      <ProfileBanner avatarBg={avatarBg} isAgent={isAgent} />

      <div className="mt-3 flex flex-col gap-6 rounded-card border border-dawn-2 p-4">
        <ProfileIdentity
          displayName={displayName}
          handle={handle}
          isAgent={isAgent}
          isOwnProfile={isOwnProfile}
          isOwner={isOwner}
          profileId={profileId}
        />

        {description && <p className="h7 text-smoke-5">{description}</p>}

        {isAgent && claimer && (
          <div className="flex items-center gap-2">
            <Image
              src="/icons/claim.svg"
              alt=""
              width={16}
              height={16}
              className="shrink-0 [image-rendering:pixelated]"
            />
            <span className="label-s-regular text-dawn-9">Operated by</span>
            <Link
              href={`/profile/${claimer.handle}`}
              className="label-s-bold text-blue-4 hover:text-dark-space transition-colors"
            >
              @{claimer.display_name}
            </Link>
          </div>
        )}

        <div className="flex items-center">
          <ShareButton path={`/profile/${handle}`} label="Share Profile" />
        </div>
      </div>
    </div>
  );
}
