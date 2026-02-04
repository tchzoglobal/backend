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
        
        // Use the actual public_id filename from Cloudinary
        f.filename = result.public_id.split('/').pop() 
        f.mimeType = `image/${result.format}`
        f.filesize = result.bytes
        f.width = result.width
        f.height = result.height
        
        // ✅ SAVE THE FULL CLOUDINARY URL
        // This prevents Payload from defaulting to /api/media/file/...
        f.url = result.secure_url 

        return f
      },

      generateURL({ filename }) {
        return `https://res.cloudinary.com/dv5xdsw9a/image/upload/subjects/${filename}`
      },

      async handleDelete({ filename }) {
        await cloudinary.uploader.destroy(`${prefix}/${filename}`)
      },

      staticHandler: () => {},
    }
  }
}