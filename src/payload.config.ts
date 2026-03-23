import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import { zh } from '@payloadcms/translations/languages/zh'
import sharp from 'sharp'

import { getEnv } from './lib/env'
import { Admins } from './payload/collections/Admins'
import { Comments } from './payload/collections/Comments'
import { Contents } from './payload/collections/Contents'
import { Features } from './payload/collections/Features'
import { Ideas } from './payload/collections/Ideas'
import { InteractionEvents } from './payload/collections/InteractionEvents'
import { Media } from './payload/collections/Media'
import { Notifications } from './payload/collections/Notifications'
import { OtpChallenges } from './payload/collections/OtpChallenges'
import { Sponsors } from './payload/collections/Sponsors'
import { Users } from './payload/collections/Users'
import { Votes } from './payload/collections/Votes'
import { SiteSettings } from './payload/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = getEnv()

const isR2Ready = Boolean(
  env.R2_BUCKET && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT,
)

export default buildConfig({
  admin: {
    autoLogin:
      env.PAYLOAD_AUTO_LOGIN_EMAIL || env.PAYLOAD_AUTO_LOGIN_USERNAME
        ? {
            email: env.PAYLOAD_AUTO_LOGIN_EMAIL,
            username: env.PAYLOAD_AUTO_LOGIN_USERNAME,
          }
        : undefined,
    user: Admins.slug,
    importMap: {
      baseDir: dirname,
    },
  },
  collections: [
    Admins,
    Users,
    OtpChallenges,
    Media,
    Contents,
    Ideas,
    Features,
    Comments,
    Votes,
    Sponsors,
    Notifications,
    InteractionEvents,
  ],
  globals: [SiteSettings],
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    push: true,
  }),
  editor: lexicalEditor(),
  i18n: {
    supportedLanguages: { zh },
  },
  routes: {
    admin: '/admin',
    api: '/payload-api',
    graphQL: '/payload-api/graphql',
    graphQLPlayground: '/payload-api/graphql-playground',
  },
  secret: env.PAYLOAD_SECRET,
  sharp,
  plugins: [
    s3Storage({
      enabled: isR2Ready,
      collections: {
        media: {
          generateFileURL: ({ filename }) => {
            if (env.R2_PUBLIC_URL) {
              return `${env.R2_PUBLIC_URL}/${filename}`
            }

            return filename
          },
        },
      },
      config: {
        region: 'auto',
        endpoint: env.R2_ENDPOINT,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
        },
      },
      bucket: env.R2_BUCKET || '',
      disableLocalStorage: process.env.NODE_ENV === 'production',
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
