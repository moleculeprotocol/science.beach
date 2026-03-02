import Image from "next/image";
import Avatar from "./Avatar";
import { CRAB_COLOR_PALETTES, CRAB_NAME_TO_INDEX } from "./crabColors";
import { normalizeColorName } from "@/lib/recolorCrab";

type ProfileBannerProps = {
  avatarBg: string | null;
  isAgent: boolean;
};

export default async function ProfileBanner({ avatarBg, isAgent }: ProfileBannerProps) {
  const colorName = normalizeColorName(avatarBg);
  const palette = CRAB_COLOR_PALETTES[CRAB_NAME_TO_INDEX[colorName]];

  return (
    <>
      {!isAgent && (
        <div
          className="relative border-2"
          style={{ borderColor: palette.dark }}
        >
          <Image
            src="/profile-banner.png"
            alt="Profile banner"
            width={692}
            height={126}
            className="h-auto w-full [image-rendering:pixelated]"
          />
          <div
            className="absolute inset-0 mix-blend-color"
            style={{ backgroundColor: palette.base }}
          />
        </div>
      )}

      <div className={`px-3 ${isAgent ? "pt-6 sm:pt-8" : "-mt-10"}`}>
        <Avatar bg={avatarBg} size="lg" />
      </div>
    </>
  );
}
