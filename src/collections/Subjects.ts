import { CollectionConfig } from 'payload'

const Subjects: CollectionConfig = {
  slug: 'subjects',
  indexes: [
    { fields: ['board', 'medium', 'grade'] },
    { fields: ['name'] },
    { fields: ['board', 'grade'] },
  ],
  access: {
    read: () => true,
  },
  labels: { singular: 'Subject', plural: 'Subjects' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'board', 'medium', 'grade', 'image'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'board', type: 'relationship', relationTo: 'boards', required: true },
    { name: 'medium', type: 'relationship', relationTo: 'mediums', required: true },
    { name: 'grade', type: 'relationship', relationTo: 'grades', required: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'cloudinaryURL',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'cloudinaryPublicId',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    // 🔥 Use beforeChange to inject data directly into the save operation
    beforeChange: [
      async ({ data, req }) => {
        if (data.image) {
          try {
            // 1. Fetch the media document being linked
            const mediaDoc = await req.payload.findByID({
              collection: 'media',
              id: data.image,
              depth: 0, // Keep it light
            });

            if (mediaDoc) {
              // 2. Map the media data directly to the incoming subject data
              data.cloudinaryURL = mediaDoc.url || '';
              data.cloudinaryPublicId = (mediaDoc as any).public_id || mediaDoc.filename || '';
              
              console.log('✅ Success: Injecting Cloudinary data into Subject save');
            }
          } catch (err) {
            console.error('❌ Hook Error:', err);
          }
        }
        return data; // Return the modified data to be saved
      },
    ],
    // Keep afterChange strictly for Next.js Revalidation (Side effects)
    afterChange: [
      async ({ doc }) => {
        if (process.env.NEXT_PUBLIC_SITE_URL) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                slug: doc.slug, 
                type: 'subject', 
                secret: process.env.REVALIDATE_TOKEN 
              }),
            });
          } catch (err) {
            console.error('❌ ISR Revalidation failed:', err);
          }
        }
      },
    ],
  },
};

export default Subjects;