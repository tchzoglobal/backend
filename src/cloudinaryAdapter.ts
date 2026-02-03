// cloudinaryAdapter.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    return {
      name: 'cloudinary',

      handleUpload: async ({ file, prefix, doc }) => {
        // 🔑 deterministic ID
        const publicId = doc?.id

        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: prefix || 'subjects',
              public_id: publicId,
              overwrite: true,
              invalidate: true,
            },
            (err, res) => {
              if (err) reject(err)
              else resolve(res!)
            }
          )

          stream.end(file.buffer)
        })

        // Payload needs filename only
        file.filename = publicId
        return file
      },

      generateURL: ({ filename, prefix }) => {
        const fullPath = prefix ? `${prefix}/${filename}` : filename
        return cloudinary.url(fullPath, {
          secure: true,
          version: Date.now(), // cache-buster
        })
      },

      handleDelete: async ({ filename, prefix }) => {
        const fullPath = prefix ? `${prefix}/${filename}` : filename
        await cloudinary.uploader.destroy(fullPath)
      },

      staticHandler: () => {},
    }
  }
}
