import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
  },

  upload: {
    disableLocalStorage: true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
