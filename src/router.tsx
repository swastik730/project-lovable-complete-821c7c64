import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload a route's chunk as soon as the user touches/hovers a link so
    // tapping a tab feels instant instead of waiting for a network round-trip.
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
    // Reuse what preloading already fetched (30s) instead of refetching on click.
    defaultPreloadStaleTime: 30_000,
    // Don't flash a loading screen for fast navigations.
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
  });

  return router;
};
