import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const LOGO_KEY = "logo_data_url";

let cached: string | null | undefined;
const listeners = new Set<(v: string | null) => void>();

async function fetchLogo() {
  const { data } = await supabase.from("app_settings").select("value").eq("key", LOGO_KEY).maybeSingle();
  cached = (data?.value as string | undefined) ?? null;
  listeners.forEach((l) => l(cached as string | null));
}

/** Owner-uploaded logo (stored as a small data URL), or null to use the bundled logo. */
export function useAppLogo() {
  const [logo, setLogo] = useState<string | null>(cached ?? null);

  useEffect(() => {
    listeners.add(setLogo);
    if (cached === undefined) void fetchLogo();
    else setLogo(cached);
    return () => {
      listeners.delete(setLogo);
    };
  }, []);

  return logo;
}

export async function saveAppLogo(dataUrl: string | null) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id ?? null;
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: LOGO_KEY, value: dataUrl, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
  cached = dataUrl;
  listeners.forEach((l) => l(dataUrl));
}

/** Reads an image file, downscales it to a square PNG and returns a data URL. */
export function fileToLogoDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
