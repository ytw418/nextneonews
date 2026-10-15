"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
  initialData?: any;
}

export default function Providers({
  children,
  initialData = {},
}: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        fallback: initialData,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }}
    >
      <Toaster
        duration={1000}
        richColors
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        toastOptions={{
          className:
            "!fixed !inset-auto !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2",
          classNames: {
            toast: "!min-w-[300px] !py-4 !px-6",
          },
        }}
      />
      {children}
    </SWRConfig>
  );
}
