"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import FeedCard, { type FeedCardProps } from "./FeedCard";
import Panel from "./Panel";
import PixelButton from "./PixelButton";
import SortBar from "./SortBar";
import SectionHeading from "./SectionHeading";
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

const PAGE_SIZE = 7;
const DEBOUNCE_MS = 350;

type FeedProps = {
  items: FeedCardProps[];
  likedPostIds?: string[];
  initialHasMore?: boolean;
  preloadedPages?: Record<string, FeedPageResult>;
  bare?: boolean;
  hideFilters?: boolean;
  showTypeHeading?: boolean;
  className?: string;
};

export default function Feed({
  items,
  likedPostIds = [],
  initialHasMore = false,
  preloadedPages,
  bare = false,
  hideFilters = false,
  showTypeHeading = false,
  className = "",
}: FeedProps) {
  const [allItems, setAllItems] = useState(items);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hypothesis" | "discussion">("all");
  const [sortMode, setSortMode] = useState<SortMode>("breakthrough");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [isFiltered, setIsFiltered] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const activeSortHeading =
    SORT_MODES.find((mode) => mode.value === sortMode)?.label ?? "All Posts";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFiltersRef = useRef<FeedFilters>({});
  const pageCacheRef = useRef<Map<string, FeedPageResult>>(new Map());

  if (pageCacheRef.current.size === 0) {
    const defaultKey = buildFeedCacheKey({
      sort: "breakthrough",
      timeWindow: "all",
      type: "all",
      search: "",
    });
    pageCacheRef.current.set(defaultKey, { items, hasMore: initialHasMore });
    if (preloadedPages) {
      for (const [key, value] of Object.entries(preloadedPages)) {
        pageCacheRef.current.set(key, value);
      }
    }
  }

  const getFilters = useCallback(
    (overrides?: Partial<FeedFilters>): FeedFilters => ({
      search: overrides?.search ?? search,
      type: overrides?.type ?? typeFilter,
      sort: overrides?.sort ?? sortMode,
      timeWindow: overrides?.timeWindow ?? timeWindow,
    }),
    [search, typeFilter, sortMode, timeWindow],
  );

  const isNonDefaultState = useCallback(
    (filters: FeedFilters) =>
      (filters.type && filters.type !== "all") ||
      filters.search?.trim() ||
      filters.sort !== "breakthrough" ||
      filters.timeWindow !== "all",
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
          });
          const cached = pageCacheRef.current.get(defaultKey);
          setAllItems(cached?.items ?? items);
          setHasMore(cached?.hasMore ?? initialHasMore);
          setIsFiltered(false);
          return;
        }

        const isCacheable = !filters.search?.trim();
        const cacheKey = buildFeedCacheKey(filters);

        if (isCacheable) {
          const cached = pageCacheRef.current.get(cacheKey);
          if (cached) {
            setAllItems(cached.items);
            setHasMore(cached.hasMore);
            setIsFiltered(!!(filters.type && filters.type !== "all"));
            return;
          }

          const firstPage = await loadFirstPagePosts(filters);
          if (currentFiltersRef.current !== filters) return;

          pageCacheRef.current.set(cacheKey, firstPage);
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
    [items, initialHasMore, isNonDefaultState, startTransition],
  );

  // Debounced search handler
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const filters = getFilters({ search: value });
      fetchFiltered(filters);
      if (value.trim()) {
        trackSearchPerformed({ query: value.trim(), result_count: allItems.length, has_more: hasMore });
      }
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleTypeChange(type: "all" | "hypothesis" | "discussion") {
    setTypeFilter(type);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchFiltered(getFilters({ type }));
    trackFeedFilterChanged({ filter_type: "type", value: type });
  }

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
  const hasMoreFiltersActive = search.trim().length > 0 || typeFilter !== "all";

  function handleLoadMore() {
    const filters = getFilters();
    trackFeedLoadMore({ action: isRandom ? "re_roll" : "load_more", current_count: allItems.length, sort_mode: sortMode });
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
    trackFeedLoadMore({ action: "load_all", current_count: allItems.length, sort_mode: sortMode });
    startTransition(async () => {
      const rest = await loadAllPosts(allItems.length, filters);
      setAllItems((prev) => [...prev, ...rest]);
      setHasMore(false);
    });
  }

  const Wrapper = bare ? "div" : Panel;
  const wrapperProps = bare
    ? { className: `flex flex-col gap-3 ${className}` }
    : { as: "section" as const, className: `w-full max-w-[716px] ${className}` };

  return (
    <Wrapper {...wrapperProps}>
      {showTypeHeading && <SectionHeading variant="white">{activeSortHeading}</SectionHeading>}

      {!hideFilters && (
        <>
          {/* Sort bar */}
          <div className="border-2 border-sand-3 bg-sand-1 px-4 py-3 flex flex-col gap-2">
            <SortBar
              activeSort={sortMode}
              activeTimeWindow={timeWindow}
              onSortChange={handleSortChange}
              onTimeWindowChange={handleTimeWindowChange}
            />
            <button
              type="button"
              aria-expanded={showMoreFilters}
              aria-controls="feed-more-filters"
              onClick={() => setShowMoreFilters((prev) => !prev)}
              className="mt-1 inline-flex w-fit self-end items-center gap-1 label-s-regular leading-[0.9] text-sand-6 transition-colors hover:text-sand-8 focus:outline-none focus:text-sand-8"
            >
              <span
                aria-hidden="true"
                className={`text-[10px] transition-transform ${showMoreFilters ? "rotate-90" : ""}`}
              >
                &gt;
              </span>
              <span>More filters</span>
              {hasMoreFiltersActive && (
                <span className="label-s-bold text-blue-4">(active)</span>
              )}
            </button>
          </div>

          {/* Search and type filters */}
          {showMoreFilters && (
            <div id="feed-more-filters" className="flex flex-col gap-2 bg-sand-1 border-2 border-sand-3 p-3">
              <input
                type="text"
                placeholder="Search by title, author..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="border-2 border-sand-4 bg-sand-1 px-3 py-1.5 mono-s text-dark-space focus:outline-none focus:border-blue-4"
              />
              <div className="flex gap-0 w-full sm:w-auto">
                {(["all", "hypothesis", "discussion"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleTypeChange(f)}
                    className={`label-s-regular flex-1 sm:flex-initial px-2.5 py-1 min-h-8 leading-[0.9] border transition-colors capitalize ${
                      typeFilter === f
                        ? "bg-dark-space text-light-space border-dark-space"
                        : "bg-smoke-7 text-smoke-2 border-smoke-5 hover:bg-sand-1"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {(search || typeFilter !== "all") && (
                <p className="label-s-regular text-smoke-5">
                  {allItems.length} result{allItems.length !== 1 ? "s" : ""}
                  {hasMore ? "+" : ""}
                  {isPending ? " ..." : ""}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Loading state */}
      {isPending && allItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative h-1 w-32 overflow-hidden bg-smoke-7 border border-smoke-5">
            <div className="absolute inset-0 w-1/3 bg-blue-4 animate-feed-scan" />
          </div>
          <p className="font-ibm-bios text-[11px] text-smoke-5">Analyzing data...</p>
        </div>
      )}

      {/* Feed cards */}
      {allItems.length === 0 && !isPending && (
        <p className="paragraph-s text-smoke-5 py-4 text-center">
          {isFiltered ? "No matching posts found" : "No hypothesis yet"}
        </p>
      )}
      <div className={`flex flex-col gap-3 transition-opacity duration-200 ${isPending && allItems.length > 0 ? "opacity-50 pointer-events-none" : ""}`}>
        {allItems.map((item, i) => (
          <FeedCard key={item.id || `feed-${i}`} {...item} initialLiked={likedPostIds.includes(item.id)} />
        ))}
      </div>

      {/* Load more / Load all */}
      {(hasMore || isRandom) && (
        <div className="flex justify-center gap-2 py-2">
          <PixelButton
            bg="smoke-7"
            textColor="smoke-5"
            shadowColor="smoke-6"
            textShadowTop="smoke-5"
            textShadowBottom="smoke-7"
            onClick={handleLoadMore}
            disabled={isPending}
            className="font-ibm-bios text-[11px]"
          >
            {isPending ? "Loading..." : isRandom ? "Re-roll" : "Load more"}
          </PixelButton>
          {!isRandom && (
            <PixelButton
              bg="smoke-7"
              textColor="smoke-5"
              shadowColor="smoke-6"
              textShadowTop="smoke-5"
              textShadowBottom="smoke-7"
              onClick={handleLoadAll}
              disabled={isPending}
              className="font-ibm-bios text-[11px]"
            >
              {isPending ? "Loading..." : "Load all"}
            </PixelButton>
          )}
        </div>
      )}
    </Wrapper>
  );
}
