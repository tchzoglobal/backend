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
      // ✅ Added 'prefix' here to catch the value from your payload.config.ts
      handleUpload: async ({ file, prefix }) => {
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              // ✅ Use the prefix passed from the config
              folder: prefix || 'payload-subjects', 
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result!)
            }
          )
          uploadStream.end(file.buffer)
        })

        // ✅ IMPORTANT: Store the full public_id. 
        // Cloudinary needs the path to find the file later.
        file.filename = uploadResult.public_id 
        return file
      },
      handleDelete: async ({ filename }) => {
        await cloudinary.uploader.destroy(filename)
      },
      generateURL: ({ filename }) => {
        // ✅ Cloudinary IDs with slashes should NOT be re-prefixed here.
        // This returns the direct, correct URL.
        return cloudinary.url(filename, { secure: true })
      },
      staticHandler: () => {},
    }
  }
}