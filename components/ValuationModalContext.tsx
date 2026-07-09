"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ValuationModalContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ValuationModalContext = createContext<ValuationModalContextValue | null>(null);

export function ValuationModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      openModal: () => setOpen(true),
      closeModal: () => setOpen(false),
    }),
    [open]
  );

  return <ValuationModalContext.Provider value={value}>{children}</ValuationModalContext.Provider>;
}

export function useValuationModal(): ValuationModalContextValue {
  const ctx = useContext(ValuationModalContext);
  if (!ctx) throw new Error("useValuationModal must be used within a ValuationModalProvider");
  return ctx;
}
