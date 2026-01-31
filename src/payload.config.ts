// storage-adapter-import-placeholder
import { cloudinaryStorage } from '@payloadcms/storage-cloudinary'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import Mediums  from './collections/Mediums'
import Boards from './collections/Boards'
import Grades from './collections/Grades'
import Subjects from './collections/Subjects'
import Lessons from './collections/Lessons'
import Resources from './collections/Resources'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  
  cors: [
    'http://localhost:3001',
    'http://192.168.0.107:3001',
    'http://localhost:19006',
    '*', // allow all during development
  ],
  csrf: [
    'http://localhost:3001',
    'http://192.168.0.107:3001',
    'http://localhost:19006',
  ],
  collections: [Users, Media, Boards, Grades, Mediums, Subjects, Lessons, Resources],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    cloudinaryStorage({
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
      collections: {
        media: true, // adjust to your media collection slug
      },
    }),
  ],
})
