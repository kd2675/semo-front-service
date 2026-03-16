"use client";

import type { HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";

type RouterLinkProps = Omit<HTMLAttributes<HTMLDivElement>, "onClick" | "onKeyDown"> & {
  href: string;
  replace?: boolean;
  scroll?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
};

function isModifiedEvent(event: MouseEvent<HTMLDivElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function RouterLink({
  href,
  replace = false,
  scroll,
  onClick,
  onKeyDown,
  children,
  className,
  role,
  tabIndex,
  ...rest
}: RouterLinkProps) {
  const router = useRouter();

  const navigate = () => {
    if (/^(https?:|mailto:|tel:|\/\/)/.test(href)) {
      window.location.assign(href);
      return;
    }

    if (replace) {
      router.replace(href, scroll === undefined ? undefined : { scroll });
      return;
    }

    router.push(href, scroll === undefined ? undefined : { scroll });
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (isModifiedEvent(event)) {
      return;
    }

    navigate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    navigate();
  };

  return (
    <div
      role={role ?? "link"}
      tabIndex={tabIndex ?? 0}
      className={className ? `${className} cursor-pointer` : "cursor-pointer"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}
