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
    adminThumbnail: ({ doc }) => {
      // If a full Cloudinary URL exists in the 'url' field, use it
      if (doc.url && (doc.url as string).includes('cloudinary')) {
        return doc.url as string
      }
      
      // Fallback for your existing records: manually construct the Cloudinary link
      // Use your Cloudinary cloud name: dv5xdsw9a
      return `https://res.cloudinary.com/dv5xdsw9a/image/upload/subjects/${doc.filename}`
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}