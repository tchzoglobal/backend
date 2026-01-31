import { CollectionConfig } from 'payload/types'

const Lessons: CollectionConfig = {
  slug: 'lessons',
  indexes: [
    {
      fields: ['subject'],
    },
    {
      fields: ['board', 'grade', 'medium'],
    },
    {
      fields: ['subject', 'board', 'grade', 'medium'],
    },
    {
      fields: ['createdAt'],
    },
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

      // 🔹 Keep your dynamic subject filtering
      filterOptions: ({ data }) => {
        const board = data?.board
        const medium = data?.medium
        const grade = data?.grade

        if (board && medium && grade) {
          return {
            board: { equals: board },
            medium: { equals: medium },
            grade: { equals: grade },
          }
        }

        return { id: { not_equals: 'null' } }
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
          const subjectId =
            typeof doc.subject === 'string'
              ? doc.subject
              : doc.subject?.id

          // 🔹 Fetch subject to get slug or name
          if (subjectId) {
            const subject = await req.payload.findByID({
              collection: 'subjects',
              id: subjectId,
            })

            // 🔹 Revalidate lessons page for that subject
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'lessons',
                subject: subject?.slug || subject?.name,
                secret: process.env.REVALIDATE_TOKEN,
              }),
            })
          }

          // 🔹 Revalidate resources page for this lesson
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
      async ({ doc }) => {
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
