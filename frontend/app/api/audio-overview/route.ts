import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_AUDIO_EPISODES } from "@/lib/audio-overview-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/audio-overview/episodes`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const eps = data.episodes || data.data || [];
        if (Array.isArray(eps) && eps.length > 0) {
          return NextResponse.json({
            success: true,
            total: eps.length,
            data: eps,
            episodes: eps,
          });
        }
      }
    } catch {
      clearTimeout(timeout);
    }
  } catch (err) {
    // Backend offline / fallback
  }

  // Instant fallback to curated episodes
  return NextResponse.json({
    success: true,
    total: DEFAULT_AUDIO_EPISODES.length,
    data: DEFAULT_AUDIO_EPISODES,
    episodes: DEFAULT_AUDIO_EPISODES,
  });
}
