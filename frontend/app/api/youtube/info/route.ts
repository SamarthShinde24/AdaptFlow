import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Normalizes title text and strips/replaces em-dashes and en-dashes
 * according to Rule R-02.
 */
function cleanTitle(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\u2014/g, " - ") // em dash to hyphen
    .replace(/\u2013/g, "-")   // en dash to hyphen
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts the 11-character YouTube video ID.
 */
function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") || searchParams.get("videoId") || searchParams.get("id");

  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: "Missing 'url' or 'videoId' query parameter" },
      { status: 400 }
    );
  }

  const videoId = extractYouTubeId(rawUrl);
  if (!videoId) {
    return NextResponse.json(
      { success: false, error: "Invalid YouTube URL or ID" },
      { status: 400 }
    );
  }

  const videoWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Primary Strategy: YouTube official oEmbed endpoint
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoWatchUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.title) {
        return NextResponse.json({
          success: true,
          videoId,
          title: cleanTitle(data.title),
          authorName: cleanTitle(data.author_name || ""),
          authorUrl: data.author_url || null,
          thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          source: "youtube_oembed",
        });
      }
    }
  } catch (err) {
    console.warn("YouTube oEmbed fetch failed, trying noembed fallback:", err);
  }

  // 2. Secondary Strategy: noembed.com open proxy
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(videoWatchUrl)}`;
    const res = await fetch(noembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.title && !data.error) {
        return NextResponse.json({
          success: true,
          videoId,
          title: cleanTitle(data.title),
          authorName: cleanTitle(data.author_name || ""),
          authorUrl: data.author_url || null,
          thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          source: "noembed",
        });
      }
    }
  } catch (err) {
    console.warn("noembed fetch failed:", err);
  }

  // 3. Graceful fallback if video is unlisted, deleted, or network unreachable
  return NextResponse.json({
    success: false,
    videoId,
    title: null,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    error: "Could not retrieve YouTube video title from oEmbed services",
  });
}
