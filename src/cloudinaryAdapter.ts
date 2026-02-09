import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

export const cloudinaryAdapter = (): Adapter => {
  return ({ prefix: staticPrefix }) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    return {
      name: 'cloudinary',

      /* -----------------------------------------
         UPLOAD HANDLER
      ----------------------------------------- */
      async handleUpload({ file, data }) {
        let folder = staticPrefix || 'misc'

        try {
          if (data?.prefix) {
            folder = data.prefix
          }
        } catch (err) {
          console.error(
            'Cloudinary prefix resolver failed:',
            err
          )
        }

        const result =
          await new Promise<UploadApiResponse>(
            (resolve, reject) => {
              const stream =
                cloudinary.uploader.upload_stream(
                  {
                    folder,
                    resource_type: 'image',
                    public_id:
                      file.filename.split('.')[0],
                  },
                  (err, res) => {
                    if (err) reject(err)
                    else resolve(res!)
                  }
                )

              stream.end(file.buffer)
            }
          )

        const f = file as any

        f.filename = `${result.public_id
          .split('/')
          .pop()}.${result.format}`

        f.mimeType = `image/${result.format}`
        f.filesize = result.bytes
        f.width = result.width
        f.height = result.height
        f.url = result.secure_url

        // Persist resolved folder
        f.prefix = folder

        return f
      },

      /* -----------------------------------------
         URL GENERATOR
      ----------------------------------------- */
      generateURL({ filename, data }) {
        const folder =
          data?.prefix ||
          staticPrefix ||
          'subjects'

        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/${filename}`
      },

      /* -----------------------------------------
         DELETE HANDLER
      ----------------------------------------- */
      async handleDelete({ filename, data }) {
        const folder =
          data?.prefix ||
          staticPrefix ||
          'subjects'

        const publicId =
          filename.split('.')[0]

        await cloudinary.uploader.destroy(
          `${folder}/${publicId}`
        )
      },

      staticHandler: () => {},
    }
  }
}
