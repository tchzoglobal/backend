import type { CollectionConfig, Where } from 'payload'

const generateSlug = ({ data }: any) => {
  if (!data) return data

  if (!data.slug && data.title) {
    data.slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return data
}

const Lessons: CollectionConfig = {
  slug: 'lessons',

  indexes: [
    { fields: ['subject'] },
    { fields: ['board', 'grade', 'medium'] },
    { fields: ['subject', 'board', 'grade', 'medium'] },
    { fields: ['createdAt'] },
  ],

  access: {
    read: () => true,
  },

  labels: {
    singular: 'Lesson',
    plural: 'Lessons',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'subject', 'board', 'grade'],
  },

  hooks: {
    // ✅ FIXED slug generation
    beforeValidate: [generateSlug],

    // ✅ SEO routing path
    afterRead: [
      ({ doc }) => {
        const boardSlug =
          typeof doc.board === 'object' ? doc.board?.slug : null

        const gradeSlug =
          typeof doc.grade === 'object' ? doc.grade?.slug : null

        const subjectSlug =
          typeof doc.subject === 'object' ? doc.subject?.slug : null

        if (boardSlug && gradeSlug && subjectSlug && doc?.slug) {
          doc.fullPath = `${boardSlug}/${gradeSlug}/${subjectSlug}/${doc.slug}`
        }

        return doc
      },
    ],

    // ✅ your existing ISR (kept + safe)
    afterChange: [
      async ({ doc, req }) => {
        try {
          const subjectId =
          typeof doc.subject === 'object' ? doc.subject?.id : doc.subject

        if (subjectId) {
          const subject = (await req.payload.findByID({
            collection: 'subjects',
            id: subjectId,
          })) as any

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'lessons',
              subject: subject?.slug || 'unknown',
              secret: process.env.REVALIDATE_TOKEN,
            }),
          })
        }

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'resources',
              lessonID: doc.id,
              secret: process.env.REVALIDATE_TOKEN,
            }),
          })
        } catch (err) {
          console.error('❌ Lesson ISR revalidation failed:', err)
        }
      },
    ],

    afterDelete: [
      async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'lessons',
              secret: process.env.REVALIDATE_TOKEN,
            }),
          })
        } catch (err) {
          console.error('❌ Lesson delete ISR failed:', err)
        }
      },
    ],
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

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
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,

      filterOptions: ({ data }): Where => {
        const board = data?.board
        const medium = data?.medium
        const grade = data?.grade

        if (board && medium && grade) {
          return {
            and: [
              { board: { equals: board } },
              { medium: { equals: medium } },
              { grade: { equals: grade } },
            ],
          }
        }

        return {
          id: { exists: false },
        }
      },
    },

    // ✅ short SEO description
    {
      name: 'description',
      type: 'textarea',
    },

    // ✅ MAIN CONTENT (critical for ranking)
    {
      name: 'content',
      type: 'richText',
    },

    // ✅ FAQ (rich results)
    {
      name: 'faqs',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
        },
        {
          name: 'answer',
          type: 'textarea',
        },
      ],
    },

    // ✅ SEO override
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

    // ✅ ordering
    {
      name: 'order',
      type: 'number',
    },
  ],
}

export default Lessons