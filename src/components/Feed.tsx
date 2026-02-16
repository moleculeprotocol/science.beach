"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import FeedCard, { type FeedCardProps } from "./FeedCard";
import PixelButton from "./PixelButton";
import { loadMorePosts, loadAllPosts, type FeedFilters } from "@/app/actions";

const PAGE_SIZE = 7;
const DEBOUNCE_MS = 350;

type FeedProps = {
  items: FeedCardProps[];
  likedPostIds?: string[];
  initialHasMore?: boolean;
  className?: string;
};

export default function Feed({ items, likedPostIds = [], initialHasMore = false, className = "" }: FeedProps) {
  const [allItems, setAllItems] = useState(items);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hypothesis" | "discussion">("all");
  const [isFiltered, setIsFiltered] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFiltersRef = useRef<FeedFilters>({});

  const getFilters = useCallback(
    (searchOverride?: string, typeOverride?: "all" | "hypothesis" | "discussion"): FeedFilters => ({
      search: searchOverride ?? search,
      type: typeOverride ?? typeFilter,
    }),
    [search, typeFilter],
  );

  const hasActiveFilters = useCallback(
    (filters: FeedFilters) => (filters.type && filters.type !== "all") || filters.search?.trim(),
    [],
  );

  // Re-fetch from offset 0 with current filters
  const fetchFiltered = useCallback(
    (filters: FeedFilters) => {
      currentFiltersRef.current = filters;
      startTransition(async () => {
        // If current filters changed while we were loading, bail
        if (currentFiltersRef.current !== filters) return;

        if (!hasActiveFilters(filters)) {
          // No filters active — restore initial data
          setAllItems(items);
          setHasMore(initialHasMore);
          setIsFiltered(false);
          return;
        }

        const data = await loadAllPosts(0, filters);
        // Stale check
        if (currentFiltersRef.current !== filters) return;

        setAllItems(data);
        setHasMore(false);
        setIsFiltered(true);
      });
    },
    [items, initialHasMore, hasActiveFilters, startTransition],
  );

  // Debounced search handler
  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFiltered(getFilters(value, undefined));
    }, DEBOUNCE_MS);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Immediate type filter handler
  function handleTypeChange(type: "all" | "hypothesis" | "discussion") {
    setTypeFilter(type);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchFiltered(getFilters(undefined, type));
  }

  function handleLoadMore() {
    const filters = getFilters();
    startTransition(async () => {
      const next = await loadMorePosts(allItems.length, hasActiveFilters(filters) ? filters : undefined);
      setAllItems((prev) => [...prev, ...next]);
      if (next.length < PAGE_SIZE) {
        setHasMore(false);
      }
    });
  }

  function handleLoadAll() {
    const filters = getFilters();
    startTransition(async () => {
      const rest = await loadAllPosts(allItems.length, hasActiveFilters(filters) ? filters : undefined);
      setAllItems((prev) => [...prev, ...rest]);
      setHasMore(false);
    });
  }

  return (
    <section
      className={`w-full max-w-[716px] bg-sand-3 flex flex-col gap-3 p-3 ${className}`}
    >
      {/* Header */}
      <div className="border-r-2 border-b-2 border-sand-4 bg-sand-2 px-4 py-3 flex items-center justify-between">
        <p className="font-ibm-bios text-shadow-feed-header text-[12px] font-normal leading-[1.4] tracking-[-0.48px] text-sand-6">
          Popular Hypothesis
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="font-ibm-bios text-[11px] text-sand-6 hover:text-sand-8 transition-colors"
        >
          Filter {open ? "v" : ">"}
        </button>
      </div>

      {/* Filter bar */}
      {open && (
        <div className="flex flex-col gap-2 bg-sand-2 border border-sand-4 p-3">
          <input
            type="text"
            placeholder="Search by title, author..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-smoke-5 bg-smoke-7 px-3 py-1.5 mono-s text-dark-space focus:outline-none focus:border-blue-4"
          />
          <div className="flex gap-0">
            {(["all", "hypothesis", "discussion"] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleTypeChange(f)}
                className={`label-s-regular px-3 py-1 border transition-colors capitalize ${
                  typeFilter === f
                    ? "bg-dark-space text-light-space border-dark-space"
                    : "bg-smoke-7 text-smoke-2 border-smoke-5 hover:bg-smoke-6"
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

      {/* Feed cards */}
      {allItems.length === 0 && !isPending && (
        <p className="paragraph-s text-smoke-5 py-4 text-center">
          {isFiltered ? "No matching posts found" : "No hypothesis yet"}
        </p>
      )}
      {allItems.map((item, i) => (
        <FeedCard key={item.id || `feed-${i}`} {...item} initialLiked={likedPostIds.includes(item.id)} />
      ))}

      {/* Load more / Load all */}
      {hasMore && (
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
            {isPending ? "Loading..." : "Load more"}
          </PixelButton>
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
        </div>
      )}
    </section>
  );
}
