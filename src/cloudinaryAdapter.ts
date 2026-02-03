import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })

    return {
      name: 'cloudinary',

      handleUpload: async ({ file }) => {
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error)
              if (!result) return reject(new Error('Cloudinary upload failed'))
              resolve(result)
            }
          )

          // Payload v2 safe
          if (file.buffer) {
            uploadStream.end(file.buffer)
          } else if (file.stream) {
            file.stream.pipe(uploadStream)
          } else {
            reject(new Error('No file buffer or stream'))
          }
        })

        // IMPORTANT: store only filename
        file.filename = uploadResult.public_id.split('/').pop()!
        file.mimeType = `image/${uploadResult.format}`
        return file
      },

      generateURL: (args: any) => {
        // 🔒 NEVER destructure blindly
        if (!args?.filename) return ''

        const prefix = args.prefix || ''
        const publicId = prefix
          ? `${prefix}/${args.filename}`
          : args.filename

        return cloudinary.url(publicId, {
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        })
      },

      handleDelete: async ({ filename, prefix }: any) => {
        if (!filename) return

        const publicId = prefix
          ? `${prefix}/${filename}`
          : filename

        await cloudinary.uploader.destroy(publicId)
      },

      staticHandler: () => {},
    }
  }
}
