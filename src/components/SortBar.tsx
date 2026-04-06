"use client";

import { useState } from "react";
import type { SortMode, TimeWindow } from "@/lib/sort-modes";
import { SORT_MODES, TIME_WINDOWS } from "@/lib/sort-modes";

type SortBarProps = {
  activeSort: SortMode;
  activeTimeWindow: TimeWindow;
  onSortChange: (sort: SortMode) => void;
  onTimeWindowChange: (tw: TimeWindow) => void;
};

export default function SortBar({
  activeSort,
  activeTimeWindow,
  onSortChange,
  onTimeWindowChange,
}: SortBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeConfig = SORT_MODES.find((m) => m.value === activeSort);
  const baseSortBtnClass =
    "label-m-bold px-3 py-1.5 min-h-8 leading-[0.9] rounded-full transition-colors";
  const activeSortBtnClass =
    "bg-dark-space text-light-space";
  const inactiveSortBtnClass =
    "bg-transparent text-smoke-4 hover:bg-dawn-2";
  const baseTimeBtnClass =
    "label-m-regular px-3 py-1.5 min-h-8 leading-[0.9] rounded-full transition-colors";

  return (
    <div className="flex flex-col gap-2">
      {/* Sort mode buttons — desktop */}
      <div className="hidden w-full sm:flex gap-0.5">
        {SORT_MODES.map((mode) => {
          const isActive = activeSort === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => onSortChange(mode.value)}
              className={`${baseSortBtnClass} ${
                isActive ? activeSortBtnClass : inactiveSortBtnClass
              } flex-1 text-center`}
              title={mode.description}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Sort mode — mobile */}
      <div className="sm:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`${baseSortBtnClass} ${activeSortBtnClass} w-full justify-between`}
        >
          <span>
            {activeConfig?.label ?? "Sort"}
          </span>
          <span className="text-[10px]">{mobileOpen ? "▲" : "▼"}</span>
        </button>
        {mobileOpen && (
          <div className="flex flex-col border border-dawn-2 rounded-section mt-1 overflow-hidden">
            {SORT_MODES.map((mode) => {
              const isActive = activeSort === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => {
                    onSortChange(mode.value);
                    setMobileOpen(false);
                  }}
                  className={`label-s-regular px-2.5 py-1.5 transition-colors ${
                    isActive
                      ? "bg-blue-4 text-light-space"
                      : "bg-smoke-6 text-orange-1 hover:bg-smoke-7"
                  }`}
                >
                  {mode.label}
                  <span className="ml-auto text-[10px] opacity-60">
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active sort description */}
      <p className="paragraph-s text-smoke-4">
        {activeConfig?.description}
      </p>

      {/* Time window sub-filter for Peer Reviewed */}
      {activeConfig?.supportsTimeWindow && (
        <div className="flex gap-0">
          {TIME_WINDOWS.map((tw) => {
            const isActive = activeTimeWindow === tw.value;
            return (
              <button
                key={tw.value}
                onClick={() => onTimeWindowChange(tw.value)}
                className={`${baseTimeBtnClass} flex-1 sm:flex-initial ${
                  isActive
                    ? "bg-blue-4 text-light-space border-blue-4"
                    : "bg-smoke-6 text-orange-1 border-smoke-5 hover:bg-smoke-7"
                }`}
              >
                {tw.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
