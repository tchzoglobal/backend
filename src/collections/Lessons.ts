import type { CollectionConfig, Where } from 'payload'

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
    defaultColumns: ['title', 'subject', 'board', 'grade', 'medium'],
  },
  fields: [
    {
      name: 'title',
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
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
      // ✅ Explicitly typing the return as Where solves the "index signature" error
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

        // Return a valid 'Where' query that matches nothing if parent fields are empty
        return {
          id: {
            exists: false,
          },
        }
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        try {
          // In 3.0, relationship fields can be objects or strings (IDs)
          const subjectId = typeof doc.subject === 'object' ? doc.subject?.id : doc.subject

          if (subjectId) {
            const subject = (await req.payload.findByID({
            collection: 'subjects',
            id: subjectId,
          })) as any

            // Revalidate lessons page
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'lessons',
                subject: subject?.slug || subject?.name || 'unknown',
                secret: process.env.REVALIDATE_TOKEN,
              }),
            })
          }

          // Revalidate resources page
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
}

export default Lessons