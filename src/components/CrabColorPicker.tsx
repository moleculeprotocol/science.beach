"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CRAB_COLOR_NAMES, type CrabColorName } from "./crabColors";
import {
  recolorStaticCrabSvg,
  svgToDataUri,
  normalizeColorName,
} from "@/lib/recolorCrab";

let crabSvgPromise: Promise<string> | null = null;
function loadStaticCrabSvg(): Promise<string> {
  if (!crabSvgPromise) {
    crabSvgPromise = fetch("/crab.svg").then((r) => r.text());
  }
  return crabSvgPromise;
}

type CrabColorPickerProps = {
  name: string;
  defaultValue?: string | null;
};

export default function CrabColorPicker({
  name,
  defaultValue,
}: CrabColorPickerProps) {
  const [svgText, setSvgText] = useState<string | null>(null);
  const [selected, setSelected] = useState<CrabColorName>(
    normalizeColorName(defaultValue),
  );

  useEffect(() => {
    loadStaticCrabSvg().then(setSvgText);
  }, []);

  const thumbnails = useMemo(() => {
    if (!svgText) return null;
    return CRAB_COLOR_NAMES.map((colorName) => ({
      name: colorName,
      src: svgToDataUri(recolorStaticCrabSvg(svgText, colorName)),
    }));
  }, [svgText]);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {CRAB_COLOR_NAMES.map((colorName) => {
          const thumb = thumbnails?.find((t) => t.name === colorName);
          const isSelected = selected === colorName;
          return (
            <button
              key={colorName}
              type="button"
              onClick={() => setSelected(colorName)}
              className={`flex flex-col items-center gap-1 border-2 p-1.5 rounded-sm transition-colors ${
                isSelected
                  ? "border-blue-4 bg-white"
                  : "border-dawn-2 bg-white hover:border-dawn-4"
              }`}
            >
              {thumb ? (
                <Image
                  src={thumb.src}
                  alt={colorName}
                  width={45}
                  height={32}
                  unoptimized
                  className="[image-rendering:pixelated]"
                />
              ) : (
                <div className="h-8 w-[45px]" />
              )}
              <span className="label-s-regular text-smoke-5 capitalize">
                {colorName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
