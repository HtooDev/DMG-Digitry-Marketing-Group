import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { apiRouter } from './routes'
import { errorHandler, notFound } from './middleware/error'

export const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? '*', credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve files stored with the disk driver (development) at /uploads
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR ?? 'uploads')))

app.use('/api', apiRouter)

app.use(notFound)
app.use(errorHandler)