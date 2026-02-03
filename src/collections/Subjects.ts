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

  labels: {
    singular: 'Subject',
    plural: 'Subjects',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'board', 'medium', 'grade', 'image'],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'board',
      type: 'relationship',
      relationTo: 'boards',
      required: true,
    },
    {
      name: 'medium',
      type: 'relationship',
      relationTo: 'mediums',
      required: true,
    },
    {
      name: 'grade',
      type: 'relationship',
      relationTo: 'grades',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],

  hooks: {
    /**
     * Only keep revalidation logic here.
     * DO NOT sync Cloudinary data manually.
     */
    afterChange: [
      async ({ doc }) => {
        if (!process.env.NEXT_PUBLIC_SITE_URL) return

        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'subject',
              id: doc.id,
              secret: process.env.REVALIDATE_TOKEN,
            }),
          })
        } catch (err) {
          console.error('❌ Revalidation failed:', err)
        }
      },
    ],
  },
}

export default Subjects
