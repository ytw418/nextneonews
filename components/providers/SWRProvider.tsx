"use client";

import { SWRConfig } from "swr";

export default function SWRProvider({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: any;
}) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
