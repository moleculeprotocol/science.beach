"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import FeedCard, { type FeedCardProps } from "./FeedCard";
import Panel from "./Panel";
import PixelButton from "./PixelButton";
import SortBar from "./SortBar";
import {
  loadFirstPagePosts,
  loadMorePosts,
  loadAllPosts,
  type FeedFilters,
  type FeedPageResult,
} from "@/app/actions";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { SORT_MODES, type SortMode, type TimeWindow } from "@/lib/sort-modes";
import {
  trackFeedSortChanged,
  trackFeedFilterChanged,
  trackSearchPerformed,
  trackFeedLoadMore,
} from "@/lib/tracking-client";
import { useFeedCove } from "@/contexts/FeedCoveContext";

const PAGE_SIZE = 7;
const DEBOUNCE_MS = 350;

type CoveTab = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  postCount: number;
};

type FeedProps = {
  items: FeedCardProps[];
  initialHasMore?: boolean;
  preloadedPages?: Record<string, FeedPageResult>;
  bare?: boolean;
  hideFilters?: boolean;
  className?: string;
  coveSlug?: string;
  initialCoveName?: string | null;
  coves?: CoveTab[];
};

export default function Feed({
  items,
  initialHasMore = false,
  preloadedPages,
  bare = false,
  hideFilters = false,
  className = "",
  coveSlug,
  initialCoveName = null,
  coves = [],
}: FeedProps) {
  const [allItems, setAllItems] = useState(items);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("breakthrough");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [isFiltered, setIsFiltered] = useState(false);
  const [activeCove, setActiveCove] = useState<string | undefined>(coveSlug);
  const { setCoveName } = useFeedCove();
  const activeConfig = SORT_MODES.find((mode) => mode.value === sortMode);
  const typeFilter: "all" | "hypothesis" | "discussion" = "all";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFiltersRef = useRef<FeedFilters>({});
  const [pageCache] = useState(() => {
    const cache = new Map<string, FeedPageResult>();
    const defaultKey = buildFeedCacheKey({
      sort: "breakthrough",
      timeWindow: "all",
      type: "all",
      search: "",
      cove: coveSlug,
    });
    cache.set(defaultKey, { items, hasMore: initialHasMore });
    if (preloadedPages) {
      for (const [key, value] of Object.entries(preloadedPages)) {
        cache.set(key, value);
      }
    }
    return cache;
  });

  const getFilters = useCallback(
    (overrides?: Partial<FeedFilters>): FeedFilters => ({
      search: overrides?.search ?? search,
      type: overrides?.type ?? typeFilter,
      sort: overrides?.sort ?? sortMode,
      timeWindow: overrides?.timeWindow ?? timeWindow,
      cove: overrides?.cove ?? activeCove,
    }),
    [search, typeFilter, sortMode, timeWindow, activeCove],
  );

  useEffect(() => {
    const nextCoveName = activeCove
      ? coves.find((cove) => cove.slug === activeCove)?.name ??
        (activeCove === coveSlug ? initialCoveName : null)
      : null;

    setCoveName(nextCoveName ?? null);

    return () => {
      setCoveName(null);
    };
  }, [activeCove, coves, coveSlug, initialCoveName, setCoveName]);

  const isNonDefaultState = useCallback(
    (filters: FeedFilters) =>
      (filters.type && filters.type !== "all") ||
      filters.search?.trim() ||
      filters.sort !== "breakthrough" ||
      filters.timeWindow !== "all" ||
      !!filters.cove,
    [],
  );

  // Re-fetch from offset 0 with current filters/sort
  const fetchFiltered = useCallback(
    (filters: FeedFilters) => {
      currentFiltersRef.current = filters;
      startTransition(async () => {
        if (currentFiltersRef.current !== filters) return;

        if (!isNonDefaultState(filters)) {
          const defaultKey = buildFeedCacheKey({
            sort: "breakthrough",
            timeWindow: "all",
            type: "all",
            search: "",
            cove: coveSlug,
          });
          const cached = pageCache.get(defaultKey);
          setAllItems(cached?.items ?? items);
          setHasMore(cached?.hasMore ?? initialHasMore);
          setIsFiltered(false);
          return;
        }

        const isCacheable = !filters.search?.trim();
        const cacheKey = buildFeedCacheKey(filters);

        if (isCacheable) {
          const cached = pageCache.get(cacheKey);
          if (cached) {
            setAllItems(cached.items);
            setHasMore(cached.hasMore);
            setIsFiltered(!!(filters.type && filters.type !== "all"));
            return;
          }

          const firstPage = await loadFirstPagePosts(filters);
          if (currentFiltersRef.current !== filters) return;

          pageCache.set(cacheKey, firstPage);
          setAllItems(firstPage.items);
          setHasMore(firstPage.hasMore);
          setIsFiltered(!!(filters.type && filters.type !== "all"));
          return;
        }

        const data = await loadAllPosts(0, filters);
        if (currentFiltersRef.current !== filters) return;

        setAllItems(data);
        setHasMore(false);
        setIsFiltered(true);
      });
    },
    [coveSlug, initialHasMore, isNonDefaultState, items, pageCache, startTransition],
  );

  // Debounced search handler
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filters = getFilters({ search: value });
      fetchFiltered(filters);
      if (value.trim()) {
        trackSearchPerformed({
          query: value.trim(),
          result_count: allItems.length,
          has_more: hasMore,
        });
      }
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSortChange(sort: SortMode) {
    trackFeedSortChanged({ from_sort: sortMode, to_sort: sort });
    setSortMode(sort);
    const newTimeWindow = sort === "most_cited" ? timeWindow : "all";
    setTimeWindow(newTimeWindow);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchFiltered(getFilters({ sort, timeWindow: newTimeWindow }));
  }

  function handleTimeWindowChange(tw: TimeWindow) {
    setTimeWindow(tw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchFiltered(getFilters({ timeWindow: tw }));
    trackFeedFilterChanged({ filter_type: "time_window", value: tw });
  }

  const isRandom = sortMode === "random_sample";
  function handleLoadMore() {
    const filters = getFilters();
    trackFeedLoadMore({
      action: isRandom ? "re_roll" : "load_more",
      current_count: allItems.length,
      sort_mode: sortMode,
    });
    startTransition(async () => {
      if (isRandom) {
        // Re-roll: replace feed with fresh random set
        const data = await loadAllPosts(0, filters);
        setAllItems(data);
      } else {
        const next = await loadMorePosts(allItems.length, filters);
        setAllItems((prev) => [...prev, ...next]);
        if (next.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    });
  }

  function handleLoadAll() {
    const filters = getFilters();
    trackFeedLoadMore({
      action: "load_all",
      current_count: allItems.length,
      sort_mode: sortMode,
    });
    startTransition(async () => {
      const rest = await loadAllPosts(allItems.length, filters);
      setAllItems((prev) => [...prev, ...rest]);
      setHasMore(false);
    });
  }

  const Wrapper = bare ? "div" : Panel;
  const wrapperProps = bare
    ? { className: `flex flex-col gap-3 ${className}` }
    : {
        as: "section" as const,
        className: `w-full ${className}`,
      };

  return (
    <Wrapper {...wrapperProps}>
      {/* Cove filter tabs */}
      {coves.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveCove(undefined);
              fetchFiltered(getFilters({ cove: undefined }));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-bold whitespace-nowrap shrink-0 transition-colors ${
              !activeCove
                ? "bg-dark-space text-light-space"
                : "border border-dawn-3 text-smoke-4 hover:bg-dawn-2"
            }`}
          >
            🔬 All Coves
          </button>
          {coves.map((cove) => {
            const isActive = activeCove === cove.slug;
            return (
              <button
                key={cove.id}
                type="button"
                onClick={() => {
                  setActiveCove(cove.slug);
                  fetchFiltered(getFilters({ cove: cove.slug }));
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-bold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? "bg-dark-space text-light-space"
                    : "border border-dawn-3 text-smoke-4 hover:bg-dawn-2"
                }`}
              >
                {cove.emoji || "🔬"} {cove.name}
              </button>
            );
          })}
        </div>
      )}

      {!hideFilters && (
        <div className="flex flex-col gap-3">
          {/* Sort row + search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="paragraph-s text-smoke-4">Sort By</span>
              <select
                value={sortMode}
                onChange={(e) => handleSortChange(e.target.value as SortMode)}
                className="border border-dawn-3 bg-white rounded-card px-3 py-1.5 paragraph-s text-dark-space focus:outline-none focus:border-blue-4"
              >
                {SORT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search Posts"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full border border-dawn-3 bg-white rounded-card px-3 py-1.5 paragraph-s text-dark-space focus:outline-none focus:border-blue-4"
              />
            </div>
          </div>

          {/* Time window sub-filter for applicable sorts */}
          {activeConfig?.supportsTimeWindow && (
            <SortBar
              activeSort={sortMode}
              activeTimeWindow={timeWindow}
              onSortChange={handleSortChange}
              onTimeWindowChange={handleTimeWindowChange}
            />
          )}

        </div>
      )}

      {/* Loading state */}
      {isPending && allItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative h-1 w-32 overflow-hidden bg-dawn-2 rounded-full">
            <div className="absolute inset-0 w-1/3 bg-blue-4 animate-feed-scan rounded-full" />
          </div>
          <p className="paragraph-s text-smoke-4">
            Analyzing data...
          </p>
        </div>
      )}

      {/* Feed cards */}
      {allItems.length === 0 && !isPending && (
        <p className="paragraph-s text-smoke-5 py-4 text-center">
          {isFiltered ? "No matching posts found" : "No hypothesis yet"}
        </p>
      )}
      <div
        className={`flex flex-col gap-3 transition-opacity duration-200 ${isPending && allItems.length > 0 ? "opacity-50 pointer-events-none" : ""}`}
      >
        {allItems.map((item, i) => (
          <FeedCard
            key={item.id || `feed-${i}`}
            {...item}
          />
        ))}
      </div>

      {/* Load more / Load all */}
      {(hasMore || isRandom) && (
        <div className="flex justify-center gap-2 py-2">
          <PixelButton
            bg="dawn-2"
            textColor="dark-space"
            pill
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Loading..." : isRandom ? "Re-roll" : "Load more"}
          </PixelButton>
          {!isRandom && (
            <PixelButton
              bg="dawn-2"
              textColor="dark-space"
              pill
              onClick={handleLoadAll}
              disabled={isPending}
            >
              {isPending ? "Loading..." : "Load all"}
            </PixelButton>
          )}
        </div>
      )}
    </Wrapper>
  );
}
