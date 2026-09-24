import { prisma } from '../lib/prisma'
import { getChannelVideos, getVideo, extractYoutubeId } from '../lib/youtube'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/apiError'
import { ensureUniqueSlug } from '../utils/slug'

export const latestVideos = asyncHandler(async (req, res) => {
  const channelId = (req.query.channelId as string | undefined) ?? process.env.YOUTUBE_CHANNEL_ID
  const videos = await getChannelVideos(channelId ?? undefined)
  res.json({ data: videos })
})

export const videoById = asyncHandler(async (req, res) => {
  const input = req.query.id as string
  const id = input.includes('youtu') ? extractYoutubeId(input) : input
  if (!id) throw new ApiError(400, 'Invalid YouTube id or URL')
  const video = await getVideo(id)
  if (!video) throw new ApiError(404, 'Video not found')
  res.json({ data: video })
})

/**
 * Fetch the channel's latest uploads and create/update vlog posts for them.
 */
export const importVideos = asyncHandler(async (req, res) => {
  const channelId = (req.body?.channelId as string | undefined) ?? process.env.YOUTUBE_CHANNEL_ID
  const videos = await getChannelVideos(channelId)

  let created = 0
  let updated = 0
  for (const video of videos) {
    const existing = await prisma.post.findFirst({ where: { youtubeId: video.id } })
    const publishedAt = new Date(video.publishedAt)

    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: video.title,
          videoUrl: video.embedUrl,
          publishedAt,
          isPublished: true,
        },
      })
      updated++
      continue
    }

    await prisma.post.create({
      data: {
        type: 'vlog',
        title: video.title,
        slug: await ensureUniqueSlug(prisma.post, video.title),
        excerpt: video.description ? video.description.slice(0, 300) : null,
        videoUrl: video.embedUrl,
        youtubeId: video.id,
        publishedAt,
        isPublished: true,
        images: video.thumbnails.length
          ? { create: [{ url: video.thumbnails[video.thumbnails.length - 1].url, isPrimary: true, sortOrder: 1 }] }
          : undefined,
      },
    })
    created++
  }

  res.json({ data: { created, updated, total: videos.length } })
})