"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";

type RouteModalPresenceProps = {
  children: (requestClose: () => void) => React.ReactNode;
  onExitComplete: () => void;
};

export function RouteModalPresence({
  children,
  onExitComplete,
}: RouteModalPresenceProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    setIsOpen(false);
  };

  return (
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={() => {
        if (isClosing) {
          onExitComplete();
        }
      }}
    >
      {isOpen ? children(requestClose) : null}
    </AnimatePresence>
  );
}
