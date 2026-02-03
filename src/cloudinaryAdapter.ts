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
      // cloudinaryAdapter.ts (Update handleUpload and generateURL)

      handleUpload: async ({ file, prefix }) => {
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: prefix || 'payload-subjects', 
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result!)
            }
          )
          uploadStream.end(file.buffer)
        })

        // 🚨 THE FIX: 
        // If public_id is "payload-subjects/abc", we only want to store "abc" in Payload's filename field.
        // Payload will use your 'prefix' config to put it back together.
        const pathParts = uploadResult.public_id.split('/');
        file.filename = pathParts[pathParts.length - 1]; 
        
        return file
      },

      generateURL: ({ filename, prefix }) => {
        // If filename is "abc" and prefix is "payload-subjects", 
        // we manually join them to get the correct Cloudinary URL.
        const fullPath = prefix ? `${prefix}/${filename}` : filename;
        return cloudinary.url(fullPath, { secure: true });
      },
      handleDelete: async ({ filename }) => {
        await cloudinary.uploader.destroy(filename)
      },
      staticHandler: () => {},
    }
  }
  
}