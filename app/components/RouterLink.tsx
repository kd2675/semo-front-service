"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

type RouterLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  replace?: boolean;
  scroll?: boolean;
};

export function RouterLink({
  href,
  replace = false,
  scroll,
  children,
  className,
  ...rest
}: RouterLinkProps) {
  const external = /^(https?:|mailto:|tel:|\/\/)/.test(href);

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={external ? false : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
