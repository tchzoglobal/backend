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
      // If the URL is already in the database (new uploads), use it
      if (doc.url) return doc.url as string;
      
      // FALLBACK for your existing MongoDB records:
      // Construct the Cloudinary URL manually using your cloud name and the filename in DB
      const cloudName = 'dv5xdsw9a'; 
      const folder = doc.prefix || 'subjects';
      return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${doc.filename}`;
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