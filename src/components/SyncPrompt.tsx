import { Link } from "@tanstack/react-router";
import { CloudUpload } from "lucide-react";
import { useSession } from "@/lib/auth";

export function SyncPrompt({ className = "" }: { className?: string }) {
  const { user, ready } = useSession();
  if (!ready || user) return null;

  return (
    <div className={`surface flex items-center gap-3 p-4 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
        <CloudUpload className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Sign in to sync</p>
        <p className="text-xs text-muted-foreground">
          Your progress lives only on this device. Sign in to keep it safe everywhere.
        </p>
      </div>
      <Link
        to="/auth"
        className="brand-gradient shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-primary-foreground"
      >
        Sign in
      </Link>
    </div>
  );
}
