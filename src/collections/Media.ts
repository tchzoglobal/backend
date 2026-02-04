import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
  },
  admin: {
    // This tells Payload which field to use for the thumbnail in the list view
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'url'],
  },

  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
