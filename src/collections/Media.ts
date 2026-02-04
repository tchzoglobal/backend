import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    // Helps with debugging to see the actual URL in the list
    defaultColumns: ['filename', 'alt', 'url'],
  },
  access: {
    read: () => true,
  },
  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    // This function forces the Admin UI to use the Cloudinary URL for previews
    adminThumbnail: ({ doc }) => doc.url as string,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}