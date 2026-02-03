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
      // 1. CLEAR OLD DATA IMMEDIATELY
      // This ensures that even if the next step fails, 
      // the old, incorrect URL is gone.
      data.cloudinaryURL = '';
      data.cloudinaryPublicId = '';

      // 2. If no image is selected, we stop here (fields stay empty)
      if (!data.image) {
        return data;
      }

      try {
        // 3. Fetch the NEW Media document
        const mediaDoc = await req.payload.findByID({
          collection: 'media',
          id: data.image,
          depth: 0, 
        });

        if (mediaDoc) {
          // 4. Inject the NEW data from the new file
          data.cloudinaryURL = mediaDoc.url || '';
          data.cloudinaryPublicId = (mediaDoc as any).public_id || mediaDoc.filename || '';
          
          console.log(`✅ Syncing new image: ${data.cloudinaryPublicId}`);
        }
      } catch (err) {
        console.error('❌ Hook failed to fetch new media data:', err);
      }

      return data;
    },
  ],
    // Keep afterChange only for Next.js revalidation
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
            console.error('❌ Revalidation failed:', err);
          }
        }
      },
    ],
  },
};

export default Subjects;