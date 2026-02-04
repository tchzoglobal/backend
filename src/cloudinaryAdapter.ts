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
              // Use the original filename or Cloudinary's generated ID
              public_id: file.filename.split('.')[0], 
            },
            (err, res) => {
              if (err) reject(err)
              else resolve(res!)
            }
          )
          stream.end(file.buffer)
        })

        const f = file as any
        
        // Ensure the filename in the DB matches Cloudinary's result
        f.filename = `${result.public_id.split('/').pop()}.${result.format}`
        f.mimeType = `image/${result.format}`
        f.filesize = result.bytes
        f.width = result.width
        f.height = result.height
        
        // ✅ CRITICAL: Save the full working URL to MongoDB
        // This stops Payload from using its internal /api/media/file/ link
        f.url = result.secure_url 

        return f
      },

      generateURL({ filename }) {
        // Fallback generator
        return `https://res.cloudinary.com/dv5xdsw9a/image/upload/subjects/${filename}`
      },

      async handleDelete({ filename }) {
        // Remove the extension for Cloudinary deletion
        const publicId = filename.split('.')[0]
        await cloudinary.uploader.destroy(`${prefix}/${publicId}`)
      },

      staticHandler: () => {},
    }
  }
}