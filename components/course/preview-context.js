"use client";

import { createContext, useContext, useMemo, useState } from "react";

const PreviewContext = createContext(null);

// Shares "which free-preview lecture is playing" between the media area and the curriculum list.
export function PreviewProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used inside <PreviewProvider>");
  return ctx;
}
