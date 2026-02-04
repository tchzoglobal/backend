import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return ({ prefix }) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    return {
      name: 'cloudinary',

      async handleUpload({ file }) {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: prefix,
              resource_type: 'image',
            },
            (err, res) => {
              if (err) reject(err)
              else resolve(res!)
            }
          )

          stream.end(file.buffer)
        })

        const f = file as any

        // Store the full public_id so generateURL knows exactly what to fetch
        f.filename = result.public_id 
        f.mimeType = `image/${result.format}`
        f.filesize = result.bytes
        f.width = result.width
        f.height = result.height

        // This is the actual URL saved to the 'url' field in the database
        f.url = result.secure_url

        return f
      },

      generateURL({ filename }) {
        // Since we stored the public_id as the filename, we just call cloudinary.url
        return cloudinary.url(filename, {
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        })
      },

      async handleDelete({ filename }) {
        // Filename is the public_id
        await cloudinary.uploader.destroy(filename)
      },

      staticHandler: () => {}, // Keep empty to prevent Payload from trying to serve the file
    }
  }
}