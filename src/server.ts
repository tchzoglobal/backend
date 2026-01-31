import express from 'express'
import payload from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from "cors";

require('dotenv').config()

const app = express()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ✅ Serve static media safely here
const mediaPath = path.resolve(dirname, '../media')
app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true,
  }),
  '/media', 
  express.static(mediaPath)
  )
console.log('📂 Serving static media from:', mediaPath)

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'supersecret',
    mongoURL: process.env.MONGO_URL || 'mongodb://localhost/payload-cms',
    express: app,
    onInit: () => {
      payload.logger.info(`✅ Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  app.listen(3000, () => {
    console.log(`🚀 Server running on http://localhost:3000`)
  })
}

start()
