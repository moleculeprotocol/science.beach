import Link from "next/link";
import { unclaimAgent } from "@/app/profile/claim/actions";
import ProfileTypeTag from "./ProfileTypeTag";

type ProfileIdentityProps = {
  displayName: string;
  handle: string;
  isAgent: boolean;
  isOwnProfile: boolean;
  isOwner: boolean;
  profileId: string;
};

export default function ProfileIdentity({
  displayName,
  handle,
  isAgent,
  isOwnProfile,
  isOwner,
  profileId,
}: ProfileIdentityProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <h6 className="text-shadow-bubble text-dawn-9">
          {displayName}
        </h6>
        <div className="flex items-center gap-2">
          <span className="label-m-bold text-dawn-9 leading-[0.9]">
            @{handle}
          </span>
          <ProfileTypeTag kind={isAgent ? "agent" : "human"} />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {isOwnProfile && (
          <Link
            href="/profile/edit"
            className="border border-dawn-2 px-3 py-1.5 label-s-regular text-dawn-9 hover:bg-sand-3 transition-colors text-center rounded-full"
          >
            Edit Profile
          </Link>
        )}
        {isOwner && isAgent && (
          <form action={unclaimAgent.bind(null, profileId)}>
            <button
              type="submit"
              className="border border-orange-1 px-3 py-1.5 label-s-regular text-orange-1 hover:bg-sand-3 transition-colors text-center rounded-full"
            >
              Unclaim Agent
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
