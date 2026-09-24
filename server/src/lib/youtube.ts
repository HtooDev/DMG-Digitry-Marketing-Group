/**
 * YouTube Data API v3 integration for vlogs.
 * Requires YOUTUBE_API_KEY (and optionally YOUTUBE_CHANNEL_ID).
 */

interface YoutubeVideo {
  id: string
  title: string
  description: string
  thumbnails: { url: string; width: number; height: number }[]
  publishedAt: string
  embedUrl: string
}

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY is not set')
  return key
}

/**
 * Extract the YouTube video ID from a watch URL, short URL, or embed URL.
 */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/**
 * Fetch a video by ID. Returns normalized data for a vlog post.
 */
export async function getVideo(id: string): Promise<YoutubeVideo | null> {
  const key = apiKey()
  const params = new URLSearchParams({
    part: 'snippet,liveStreamingDetails',
    id,
    key,
  })
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`)
  const data = (await res.json()) as any

  const item = data?.items?.[0]
  if (!item) return null

  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnails: Object.values(item.snippet.thumbnails ?? {}).map(
      (t: any) => ({ url: t.url, width: t.width, height: t.height }),
    ),
    publishedAt: item.snippet.publishedAt,
    embedUrl: `https://www.youtube.com/embed/${item.id}`,
  }
}

/**
 * Fetch the latest uploads from a channel (playlistItems + videos).
 */
export async function getChannelVideos(channelId?: string): Promise<YoutubeVideo[]> {
  const key = apiKey()
  const channel = channelId ?? process.env.YOUTUBE_CHANNEL_ID
  if (!channel) throw new Error('YOUTUBE_CHANNEL_ID is not set')

  // First get the uploads playlist id for the channel
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel}&key=${key}`,
  )
  const channelData = (await channelRes.json()) as any
  const uploadsPlaylist = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsPlaylist) return []

  // Pull video ids from that playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=10&key=${key}`,
  )
  const playlistData = (await playlistRes.json()) as any

  const ids = (playlistData.items ?? []).map((i: any) => i.snippet.resourceId.videoId)
  if (ids.length === 0) return []

  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.join(',')}&key=${key}`,
  )
  const videosData = (await videosRes.json()) as any

  return (videosData.items ?? []).map((v: any) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    thumbnails: Object.values(v.snippet.thumbnails ?? {}).map((t: any) => ({
      url: t.url,
      width: t.width,
      height: t.height,
    })),
    publishedAt: v.snippet.publishedAt,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
  }))
}