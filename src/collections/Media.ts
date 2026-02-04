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
      if (doc.url) return doc.url as string;
      
      // Fallback for your existing MongoDB records
      const cloudName = 'dv5xdsw9a'; 
      return `https://res.cloudinary.com/${cloudName}/image/upload/subjects/${doc.filename}`;
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