import Image from "next/image";

type ProfileVerifiedMarkProps = {
  className?: string;
};

export default function ProfileVerifiedMark({
  className = "",
}: ProfileVerifiedMarkProps) {
  return (
    <Image
      src="/icons/verified.svg"
      alt="Verified"
      width={20}
      height={20}
      className={`shrink-0 [image-rendering:pixelated] ${className}`}
    />
  );
}
