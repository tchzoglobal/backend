import { CollectionConfig } from 'payload'

const Subjects: CollectionConfig = {
  slug: 'subjects',
  // ✅ Preserved custom indexes for performance
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
    // ✅ Metadata fields synchronized from the Media collection
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
    afterChange: [
      async ({ doc, req }) => {
        // Only proceed if an image is attached
        if (!doc.image) return;

        try {
          // 1. Resolve the ID of the attached media
          const mediaId = typeof doc.image === 'object' ? doc.image.id : doc.image;

          // 2. Fetch the "Source of Truth" from the Media collection
          const mediaDoc = await req.payload.findByID({
            collection: 'media',
            id: mediaId,
          });

          // 3. Update the Subject record only if the data is missing or mismatched
          // This prevents infinite loops while ensuring data is always fresh
          if (mediaDoc && mediaDoc.url !== doc.cloudinaryURL) {
            await req.payload.update({
              collection: 'subjects',
              id: doc.id,
              data: {
                cloudinaryURL: mediaDoc.url,
                // We use the filename or the custom public_id field if present
                cloudinaryPublicId: (mediaDoc as any).public_id || mediaDoc.filename,
              },
            });
          }

          // 🔹 Next.js ISR Revalidation
          // This clears the cache on your Vercel frontend automatically
          if (process.env.NEXT_PUBLIC_SITE_URL) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                slug: doc.slug, 
                type: 'subject', 
                secret: process.env.REVALIDATE_TOKEN 
              }),
            });
          }
        } catch (err) {
          console.error('❌ Subject Hook Sync/ISR failed:', err);
        }
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        // Ensure the deleted content is also removed from the Next.js cache
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
            console.error('❌ ISR Delete Revalidation failed:', err);
          }
        }
      },
    ],
  },
};

export default Subjects;