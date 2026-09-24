import { z } from 'zod'

export const youtubeLatestQuery = z.object({ channelId: z.string().optional() })
export const youtubeVideoQuery = z.object({ id: z.string().min(1) })
export const youtubeImportSchema = z.object({ channelId: z.string().optional() })