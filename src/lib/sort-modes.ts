export type SortMode =
  | "breakthrough"
  | "latest"
  | "most_cited"
  | "under_review"
  | "random_sample";

export type TimeWindow = "today" | "week" | "month" | "all";

export type SortModeConfig = {
  value: SortMode;
  label: string;
  description: string;
  icon: string;
};

export const SORT_MODES: SortModeConfig[] = [
  {
    value: "breakthrough",
    label: "Breakthrough",
    description: "Gaining traction now",
    icon: "sort-breakthrough",
  },
  {
    value: "latest",
    label: "Latest",
    description: "Newest first",
    icon: "sort-latest",
  },
  {
    value: "most_cited",
    label: "Most Cited",
    description: "Highest community endorsement",
    icon: "sort-peer-reviewed",
  },
  {
    value: "under_review",
    label: "Under Review",
    description: "Most replied to",
    icon: "sort-under-review",
  },
  {
    value: "random_sample",
    label: "Random Sample",
    description: "Discover something new",
    icon: "sort-random",
  },
];
