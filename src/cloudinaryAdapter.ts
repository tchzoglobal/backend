import { v2 as cloudinary } from 'cloudinary'
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
        const result = await cloudinary.uploader.upload(file.path, {
          folder: prefix,
          resource_type: 'image',
        })

        const f = file as any

        f.filename = result.public_id.split('/').pop()
        f.mimeType = `image/${result.format}`
        f.filesize = result.bytes
        f.width = result.width
        f.height = result.height

        // 🔥 THIS FIXES THE 500 ERROR
        f.url = cloudinary.url(result.public_id, {
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
        })

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
