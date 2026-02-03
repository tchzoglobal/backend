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
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: prefix, // ✅ THIS NOW WORKS
          resource_type: 'image',
        })

        const f = file as any

        f.filename = uploadResult.public_id.split('/').pop()
        f.mimeType = `image/${uploadResult.format}`
        f.filesize = uploadResult.bytes
        f.width = uploadResult.width
        f.height = uploadResult.height

        return f
      },

      generateURL({ filename, size }) {
        return cloudinary.url(`${prefix}/${filename}`, {
          secure: true,
          width: size?.width,
          height: size?.height,
          crop: size?.crop || 'fill',
          fetch_format: 'auto',
          quality: 'auto',
        })
      },

      async handleDelete({ filename }) {
        await cloudinary.uploader.destroy(`${prefix}/${filename}`)
      },

      staticHandler() {},
    }
  }
}
