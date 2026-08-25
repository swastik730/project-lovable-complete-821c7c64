import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Subtle banner shown when the device loses its connection. */
export function OfflineBar() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-1.5 text-[11px] font-bold text-warning">
      <WifiOff className="h-3.5 w-3.5" />
      Offline mode — saved lessons &amp; practice still work
    </div>
  );
}
