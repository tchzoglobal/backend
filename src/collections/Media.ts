import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
  },

  upload: {
    /**
     * Local dir is required by Payload even when using Cloudinary
     * (acts as a fallback, not actually used in prod)
     */
    staticDir: 'media',

    /**
     * ✅ Image variants
     * Cloudinary will generate & host these
     */
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
        crop: 'center',
        formatOptions: {
          format: 'webp',
        },
      },
     
    ],

    /**
     * ✅ THIS is what makes thumbnails appear in:
     * - Media list
     * - Relationship fields
     * - Subject table
     * - Subject edit sidebar
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
