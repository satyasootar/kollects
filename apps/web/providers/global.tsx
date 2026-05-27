"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { Toaster } from "~/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
    },
  },
});

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <trpc.Provider queryClient={queryClient} client={trpcClient}>
            {children}
            <Toaster />
          </trpc.Provider>
        </NextThemesProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};
