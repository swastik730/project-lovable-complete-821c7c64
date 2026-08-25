import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy email-link reset page. Password recovery now happens on /auth with a
 * username + secret answer, so this URL only exists to keep old links working.
 */
export const Route = createFileRoute("/reset-password")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", replace: true });
  },
});
