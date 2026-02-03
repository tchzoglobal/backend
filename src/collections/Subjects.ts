import { CollectionConfig } from 'payload';

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
    afterChange: [
      async ({ doc, req }) => {
        if (!doc.image) return;

        try {
          // Get the ID of the media document
          const mediaId = typeof doc.image === 'object' ? doc.image.id : doc.image;

          // Fetch the full Media document
          const mediaDoc = await req.payload.findByID({
            collection: 'media',
            id: mediaId,
          });

          // Check if we need to sync the URL and PublicID to this Subject
          // We use the raw mediaDoc.url which is generated correctly by the adapter
          if (mediaDoc && mediaDoc.url !== doc.cloudinaryURL) {
            await req.payload.update({
              collection: 'subjects',
              id: doc.id,
              data: {
                cloudinaryURL: mediaDoc.url,
                // Using filename as fallback if public_id isn't explicitly on the doc
                cloudinaryPublicId: (mediaDoc as any).public_id || mediaDoc.filename, 
              },
            });
          }

          // ISR Revalidation
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
          console.error('❌ Subject Hook failed:', err);
        }
      },
    ],
    afterDelete: [
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
            console.error('❌ ISR Delete Revalidation failed:', err);
          }
        }
      },
    ],
  },
};

export default Subjects;