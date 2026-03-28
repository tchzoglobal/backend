import type { CollectionConfig  } from 'payload'

const generateSlug = ({ value, data }: any) => {
  // If slug already manually entered → keep it
  if (value) return value

  // Auto-generate from name
  if (data?.name) {
    return data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return value
}

const Subjects: CollectionConfig = {
  slug: 'subjects',

  indexes: [
    { fields: ['board', 'medium', 'grade'] },
    { fields: ['board', 'grade'] },
    { fields: ['name'] },
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
    defaultColumns: ['name', 'slug', 'board', 'grade'],
  },

  hooks: {
    // ✅ slug generation at collection level
    beforeValidate: [generateSlug],

    // ✅ computed SEO path
    afterRead: [
      ({ doc }) => {
        const boardSlug =
          typeof doc.board === 'object' ? doc.board?.slug : null

        const gradeSlug =
          typeof doc.grade === 'object' ? doc.grade?.slug : null

        if (boardSlug && gradeSlug && doc?.slug) {
          doc.fullPath = `${boardSlug}/${gradeSlug}/${doc.slug}`
        }

        return doc
      },
    ],

    // ✅ ISR revalidation
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

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },

    // ✅ slug field (no hooks here)
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
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
      admin: {
        position: 'sidebar',
      },
    },

    // ✅ short SEO-friendly description
    {
      name: 'description',
      type: 'textarea',
    },

    // ✅ intro content (rich)
    {
      name: 'intro',
      type: 'richText',
    },

    // ✅ FAQ (for rich results)
    {
      name: 'faqs',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
    },

    // ✅ manual SEO override
    {
      name: 'seo',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },

    // ✅ sorting control
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

export default Subjects