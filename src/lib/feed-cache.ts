import type { SortMode, TimeWindow } from "./sort-modes";

export type FeedCacheFilters = {
  search?: string;
  type?: "all" | "hypothesis" | "discussion";
  sort?: SortMode;
  timeWindow?: TimeWindow;
  cove?: string;
};

export function buildFeedCacheKey(filters: FeedCacheFilters): string {
  const sort = filters.sort ?? "breakthrough";
  const timeWindow = sort === "most_cited" ? (filters.timeWindow ?? "all") : "all";
  const type = filters.type ?? "all";
  const search = filters.search?.trim().toLowerCase() ?? "";
  const cove = filters.cove ?? "";
  return `${sort}|${timeWindow}|${type}|${search}|${cove}`;
}
