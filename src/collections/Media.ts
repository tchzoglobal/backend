import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
  },

  upload: {
    staticDir: 'media',

    /**
     * ✅ Generate multiple image sizes (Cloudinary will handle this)
     */
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        crop: 'fill',
        formatOptions: {
        format: "webp",
        },
      },
      {
        name: 'card',
        width: 600,
        formatOptions: {
        format: "webp",
        },
      },
      {
        name: 'hero',
        width: 1200,
        formatOptions: {
        format: "webp",
        },
      },
    ],

    /**
     * ✅ This enables thumbnail preview in Payload Admin
     */
    adminThumbnail: 'thumbnail',

    mimeTypes: ['image/*'],
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
