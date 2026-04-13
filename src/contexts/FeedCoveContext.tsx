"use client";

import { createContext, useContext, useState } from "react";

type FeedCoveContextValue = {
  coveName: string | null;
  setCoveName: (name: string | null) => void;
};

const FeedCoveContext = createContext<FeedCoveContextValue>({
  coveName: null,
  setCoveName: () => {},
});

export function FeedCoveProvider({ children }: { children: React.ReactNode }) {
  const [coveName, setCoveName] = useState<string | null>(null);
  return (
    <FeedCoveContext.Provider value={{ coveName, setCoveName }}>
      {children}
    </FeedCoveContext.Provider>
  );
}

export function useFeedCove() {
  return useContext(FeedCoveContext);
}
