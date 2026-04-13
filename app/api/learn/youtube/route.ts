import { NextRequest, NextResponse } from "next/server";

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, standard } = await req.json();
    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const searchQuery = `${topic} ${subject || ""} ${standard || ""} NCERT explanation in Hindi English`;

    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=8&relevanceLanguage=en&key=${YT_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      const err = await searchRes.text();
      console.error("YouTube search error:", err);
      return NextResponse.json({ error: "YouTube search failed" }, { status: 500 });
    }

    const searchData = await searchRes.json();
    const videos = (searchData.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title || "",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      channelTitle: item.snippet?.channelTitle || "",
      publishedAt: item.snippet?.publishedAt || "",
    }));

    // Also search for playlists
    const playlistUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery + " full playlist")}&type=playlist&maxResults=3&key=${YT_API_KEY}`;
    const plRes = await fetch(playlistUrl);
    let playlists: any[] = [];

    if (plRes.ok) {
      const plData = await plRes.json();
      playlists = (plData.items || []).map((item: any) => ({
        playlistId: item.id?.playlistId,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        thumbnail: item.snippet?.thumbnails?.medium?.url || "",
        channelTitle: item.snippet?.channelTitle || "",
      }));
    }

    return NextResponse.json({ videos, playlists });
  } catch (err: any) {
    console.error("YouTube API error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
