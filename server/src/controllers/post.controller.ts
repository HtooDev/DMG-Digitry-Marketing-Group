import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'
import { parsePagination } from '../utils/pagination'
import { extractYoutubeId } from '../lib/youtube'

const postInclude = {
  images: { orderBy: { sortOrder: 'asc' } },
} as const

interface ImageInput {
  url: string
  alt?: string | null
  isPrimary?: boolean
  sortOrder?: number
}

function toPostImage(image: ImageInput) {
  return { url: image.url, alt: image.alt ?? null, isPrimary: image.isPrimary ?? false, sortOrder: image.sortOrder ?? 0 }
}

/**
 * If the post is a vlog, derive the YouTube id from videoUrl (or the provided id)
 * and make sure videoUrl exists.
 */
function normalizeVideo(type: string, videoUrl?: string | null, youtubeId?: string | null) {
  if (type !== 'vlog') return { videoUrl: null, youtubeId: null }
  const derived = videoUrl ? extractYoutubeId(videoUrl) ?? null : null
  const id = derived ?? youtubeId ?? null
  return {
    videoUrl: videoUrl ?? (id ? `https://www.youtube.com/watch?v=${id}` : null),
    youtubeId: id,
  }
}

export const listPosts = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const { page, limit, skip } = parsePagination(req.query)
  const type = req.query.type as string | undefined
  const q = req.query.q as string | undefined

  const where: Prisma.PostWhereInput = {
    ...(isAdmin ? {} : { isPublished: true }),
    ...(type === 'blog' || type === 'vlog' ? { type } : {}),
    ...(q ? { title: { contains: q } } : {}),
  }
  const [total, data] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
  ])
  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

export const getPost = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const post = await prisma.post.findFirst({
    where: { slug: req.params.slug, ...(isAdmin ? {} : { isPublished: true }) },
    include: postInclude,
  })
  if (!post) throw new ApiError(404, 'Post not found')
  res.json({ data: post })
})

export const createPost = asyncHandler(async (req, res) => {
  const body = req.body as {
    type?: 'blog' | 'vlog'
    title: string
    slug?: string
    excerpt?: string | null
    content?: string | null
    videoUrl?: string | null
    youtubeId?: string | null
    publishedAt?: string | null
    isPublished?: boolean
    images?: ImageInput[]
  }
  const type = body.type ?? 'blog'
  const video = normalizeVideo(type, body.videoUrl, body.youtubeId)
  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.post, body.title))

  const post = await prisma.post.create({
    data: {
      type,
      title: body.title,
      slug,
      excerpt: body.excerpt ?? null,
      content: body.content ?? null,
      videoUrl: video.videoUrl,
      youtubeId: video.youtubeId,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      isPublished: body.isPublished ?? false,
      images: { create: (body.images ?? []).map(toPostImage) },
    },
    include: postInclude,
  })
  res.status(201).json({ data: post })
})

export const updatePost = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Post not found')

  const { images, videoUrl, youtubeId, type, publishedAt, ...rest } = req.body as Record<string, unknown> & {
    images?: ImageInput[]
    videoUrl?: string | null
    youtubeId?: string | null
    type?: 'blog' | 'vlog'
  }
  const data: Prisma.PostUpdateInput = { ...(rest as Prisma.PostUpdateInput) }
  const nextType = (type as 'blog' | 'vlog' | undefined) ?? existing.type
  const video = normalizeVideo(nextType, videoUrl ?? existing.videoUrl, youtubeId ?? existing.youtubeId)
  if (type && type !== existing.type) data.type = nextType
  data.videoUrl = video.videoUrl
  data.youtubeId = video.youtubeId
  if (publishedAt !== undefined) {
    data.publishedAt = publishedAt === null ? null : new Date(publishedAt as string)
  }
  if (rest.slug === '') data.slug = await ensureUniqueSlug(prisma.post, (rest.title as string) ?? existing.title)
  if (Array.isArray(images)) {
    data.images = { deleteMany: {}, create: images.map(toPostImage) }
  }

  const post = await prisma.post.update({ where: { id }, data, include: postInclude })
  res.json({ data: post })
})

export const deletePost = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.post.delete({ where: { id } })
  res.status(204).end()
})

// ---- Post images ----------------------------------------------------------

export const addPostImage = asyncHandler(async (req, res) => {
  const postId = parseId(req.params.id)
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new ApiError(404, 'Post not found')

  const body = req.body as ImageInput
  let image: Awaited<ReturnType<typeof prisma.postImage.create>> | null = null
  await prisma.$transaction(async (tx) => {
    if (body.isPrimary) {
      await tx.postImage.updateMany({ where: { postId, isPrimary: true }, data: { isPrimary: false } })
    }
    image = await tx.postImage.create({ data: { postId, ...toPostImage(body) } })
  })
  res.status(201).json({ data: image })
})

export const setPostPrimaryImage = asyncHandler(async (req, res) => {
  const postId = parseId(req.params.id)
  const imageId = parseId(req.params.imageId)
  await prisma.$transaction([
    prisma.postImage.updateMany({ where: { postId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.postImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ])
  res.json({ data: { ok: true } })
})

export const deletePostImage = asyncHandler(async (req, res) => {
  const imageId = parseId(req.params.imageId)
  await prisma.postImage.delete({ where: { id: imageId } })
  res.status(204).end()
})