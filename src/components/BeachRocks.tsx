import Image from "next/image";

const ROCKS = [
  { x: 12, y: 30, size: 70, flipped: false },
  { x: 38, y: 10, size: 55, flipped: true },
  { x: 65, y: 35, size: 80, flipped: false },
  { x: 88, y: 15, size: 60, flipped: true },
];

export default function BeachRocks() {
  return (
    <div
      className="pointer-events-none absolute w-full"
      style={{ top: "280px", height: "120px" }}
    >
      {ROCKS.map((rock, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${rock.x}%`,
            top: `${rock.y}%`,
            transform: rock.flipped ? "scaleX(-1)" : undefined,
          }}
        >
          <Image
            src="/rock.svg"
            alt="pixel rock"
            width={rock.size}
            height={rock.size}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      ))}
    </div>
  );
}
