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
  if (file.filename) {
    // prevents re-upload for derived sizes
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

  file.filename = uploadResult.public_id.split('/').pop()!
  return file
},

      /**
       * ✅ THIS IS THE IMPORTANT PART
       * Payload calls this with `size` for thumbnails
       */
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
