import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { cloudinaryAdapter } from './cloudinaryAdapter'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import Mediums from './collections/Mediums'
import Boards from './collections/Boards'
import Grades from './collections/Grades'
import Subjects from './collections/Subjects'
import Lessons from './collections/Lessons'
import Resources from './collections/Resources'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  serverURL:
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    'http://localhost:3000',

  cors: [
  'http://localhost:3001',
  'http://192.168.0.107:3001',
  'https://www.edzyte.com',
  'https://edzyte.com',
  process.env.NEXT_PUBLIC_SITE_URL || '',
  'https://backend-965917092567.asia-south1.run.app', // Add your actual Vercel domain
].filter(Boolean),

csrf: [
  'https://www.edzyte.com',
  'https://edzyte.com',
  process.env.NEXT_PUBLIC_SITE_URL || '',
  'https://backend-965917092567.asia-south1.run.app',
].filter(Boolean),

  collections: [
    Users,
    Media,
    Boards,
    Grades,
    Mediums,
    Subjects,
    Lessons,
    Resources,
  ],

  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',

  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),

  sharp,

  plugins: [
    isCloudinaryConfigured
      ? cloudStoragePlugin({
          collections: {
            media: {
              adapter: cloudinaryAdapter(),
              prefix: 'subjects',
            },
          },
        })
      : (config) => config,
    
    // [2] Add the SEO plugin here
    seoPlugin({
      collections: ['boards', 'grades', 'mediums', 'subjects', 'lessons', 'resources'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }: any) => {
        return doc?.title || doc?.name ? `${doc.title || doc.name} | Edzyte` : 'Edzyte'
      },
      generateDescription: ({ doc }: any) => {
        return doc?.description || 'Explore high-quality educational resources on Edzyte.'
      },
      generateURL: ({ doc, collection }: any) => {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edzyte.com'
        
        // CUSTOM LOGIC: If it's a resource, link to the Lesson page instead of the PDF
        if (collection.slug === 'resources' && doc.lesson) {
            const lessonId = typeof doc.lesson === 'object' ? doc.lesson.id : doc.lesson;
            return `${siteUrl}/lessons/${lessonId}`;
        }
        
        return `${siteUrl}/${collection.slug}/${doc?.slug || doc?.id}`
      },
    }),
  ],
})
