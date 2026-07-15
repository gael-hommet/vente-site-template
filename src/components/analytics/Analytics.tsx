"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

/**
 * Fires a `page_view` on route change. Mount once in the root layout. It does
 * NOT inject any third-party script — add the provider's snippet/package
 * yourself when you enable one; this only routes events through track().
 */
export function Analytics() {
  const pathname = usePathname();

  React.useEffect(() => {
    track("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
