"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/store";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { useLenis } from "@/hooks/useLenis";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginSuccess } from "@/store/authSlice";
import { getAccessToken, getRoleCookie } from "@/lib/apiClient";
import { isValidRole } from "@/lib/roles";

// On reload the Redux store resets — restore the signed-in role from the
// session cookie so the sidebar never flashes another role's navigation.
// Runs only when a session token is present (never resurrects a logout).
function AuthRehydrate() {
  const dispatch = useAppDispatch();
  const userName = useAppSelector((s) => s.auth.userName);
  useEffect(() => {
    if (userName || !getAccessToken()) return;
    const role = getRoleCookie();
    if (isValidRole(role)) {
      dispatch(loginSuccess({ role, userName: "" }));
    }
  }, [dispatch, userName]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } })
  );
  useLenis();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
          <AuthRehydrate />
          {children}
          {process.env.NODE_ENV !== "production" && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
          )}
        </ReduxProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}