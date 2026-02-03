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

      handleUpload: async ({ file, prefix }) => {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: prefix || 'subjects',
          resource_type: 'image',
        })

        const mutableFile = file as any

        mutableFile.filename = uploadResult.public_id.split('/').pop()!
        mutableFile.mimeType = `image/${uploadResult.format}`
        mutableFile.width = uploadResult.width
        mutableFile.height = uploadResult.height
        mutableFile.filesize = uploadResult.bytes

        mutableFile.url = cloudinary.url(uploadResult.public_id, {
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        })
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
