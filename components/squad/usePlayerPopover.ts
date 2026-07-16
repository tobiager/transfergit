"use client";

import { useState } from "react";
import {
  useFloating,
  useHover,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  offset,
  flip,
  shift,
  safePolygon,
  autoUpdate,
} from "@floating-ui/react";

// Shared hover-on-desktop / tap-on-mobile popover wiring for a single
// player chip (used by both pitch and bench cards).
export function usePlayerPopover() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  // safePolygon keeps the popover open while the cursor travels from the
  // trigger into the floating panel, so the GitHub/Transfergit links inside
  // it are actually reachable instead of the panel closing mid-move.
  const hover = useHover(context, { move: false, handleClose: safePolygon() });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  return { refs, floatingStyles, isOpen, getReferenceProps, getFloatingProps };
}
