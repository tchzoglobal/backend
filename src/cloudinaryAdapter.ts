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

      handleUpload: async ({ file }) => {
        // ✅ If already uploaded to Cloudinary, skip
        if ((file as any).cloudinaryPublicId) {
          return file
        }

        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'subjects',
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result!)
            }
          )

          uploadStream.end(file.buffer)
        })

        // ✅ Store Cloudinary reference
        const publicId = uploadResult.public_id

        file.filename = publicId.split('/').pop()!
        ;(file as any).cloudinaryPublicId = publicId

        return file
      },

      generateURL: ({ filename, size }: any) => {
        const publicId = `subjects/${filename}`

        return cloudinary.url(publicId, {
          secure: true,
          width: size?.width,
          height: size?.height,
          crop: size?.crop || 'fill',
          fetch_format: 'auto',
          quality: 'auto',
        })
      },

      handleDelete: async ({ filename }) => {
        const publicId = `subjects/${filename}`
        await cloudinary.uploader.destroy(publicId)
      },

      staticHandler: () => {},
    }
  }
}
