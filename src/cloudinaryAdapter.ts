import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return ({ collection }) => {
    // Configure Cloudinary
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
              resource_type: 'auto',
              folder: 'media', // You can change the folder name here
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result!)
            }
          )
          uploadStream.end(file.buffer)
        })

        // Update the file metadata with Cloudinary data
        file.filename = uploadResult.public_id
        return file
      },
      handleDelete: async ({ filename }) => {
        await cloudinary.uploader.destroy(filename)
      },
      generateURL: ({ filename }) => {
        return cloudinary.url(filename, { secure: true })
      },
      staticHandler: () => {}, // Not needed for Cloudinary
    }
  }
}