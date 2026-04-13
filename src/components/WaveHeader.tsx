import PixelWave from "./PixelWave";
import { type ReactNode } from "react";

type WaveHeaderProps = {
  className?: string;
  children?: ReactNode;
};

export default function WaveHeader({
  className = "h-[160px] sm:h-[196px] md:h-[220px]",
  children,
}: WaveHeaderProps) {
  return (
    <section
      aria-hidden="true"
      className={`relative z-10 w-full overflow-hidden ${className}`}
    >
      <PixelWave />
      {children}
    </section>
  );
}
