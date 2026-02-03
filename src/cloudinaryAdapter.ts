// cloudinaryAdapter.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return ({ collection }) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    return {
      name: 'cloudinary',

      handleUpload: async ({ file }) => {
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'subjects',
              use_filename: false,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result!)
            }
          )

          uploadStream.end(file.buffer)
        })

        // Store ONLY the public_id without folder
        const publicId = uploadResult.public_id
        file.filename = publicId.includes('/')
          ? publicId.split('/').pop()!
          : publicId

        return file
      },

      /**
       * ✅ THIS IS THE IMPORTANT PART
       * Payload calls this with `size` for thumbnails
       */
      generateURL: ({ filename, size }) => {
        const publicId = `subjects/${filename}`

        const transformation: any = {
          secure: true,
        }

        if (size) {
          transformation.width = size.width
          transformation.height = size.height
          transformation.crop = size.crop || 'fill'
          transformation.format = size.formatOptions?.format || undefined
        }

        return cloudinary.url(publicId, transformation)
      },

      handleDelete: async ({ filename }) => {
        const publicId = `subjects/${filename}`
        await cloudinary.uploader.destroy(publicId)
      },

      staticHandler: () => {},
    }
  }
}
