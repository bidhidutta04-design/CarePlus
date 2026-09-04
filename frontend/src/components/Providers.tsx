"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/store";
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { useLenis } from "@/hooks/useLenis";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } })
  );
  useLenis();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </ReduxProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}