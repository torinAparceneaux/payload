import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateImportMap } from 'payload'

import { load } from './loader/load.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const testSuiteArg = process.argv[2]
const writeDBAdapter = process.argv[3]

const databaseAdapters = {
  mongodb: `
  import { mongooseAdapter } from '@payloadcms/db-mongodb'

  export const databaseAdapter = mongooseAdapter({
    url:
      process.env.MONGODB_MEMORY_SERVER_URI ||
      process.env.DATABASE_URI ||
      'mongodb://127.0.0.1/payloadtests',
    collation: {
      strength: 1,
    },
  })`,
  postgres: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  })`,
  'postgres-custom-schema': `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
    schemaName: 'custom',
  })`,
  'postgres-uuid': `
    import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  })`,
  sqlite: `
  import { sqliteAdapter } from '@payloadcms/db-sqlite'

  export const databaseAdapter = sqliteAdapter({
    client: {
      url: process.env.SQLITE_URL || 'file:./payloadtests.db',
    },
  })`,
  supabase: `
  import { postgresAdapter } from '@payloadcms/db-postgres'

  export const databaseAdapter = postgresAdapter({
    pool: {
      connectionString:
        process.env.POSTGRES_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
  })`,
}

export async function initDevAndTest() {
  // create a new importMap.js with contents export const importMap = {} in app/(payload)/admin/importMap.js - delete existing file:
  if (testSuiteArg === 'live-preview') {
    fs.writeFileSync(
      'test/live-preview/app/(payload)/admin/importMap.js',
      'export const importMap = {}',
    )
  } else {
    fs.writeFileSync('app/(payload)/admin/importMap.js', 'export const importMap = {}')
  }

  if (writeDBAdapter === 'true') {
    const dbAdapter: keyof typeof databaseAdapters =
      (process.env.PAYLOAD_DATABASE as keyof typeof databaseAdapters) || 'mongodb'

    // Generate databaseAdapter.ts
    const databaseAdapter = databaseAdapters[dbAdapter]

    // Write to databaseAdapter.ts
    fs.writeFileSync(
      path.resolve(dirname, 'databaseAdapter.ts'),
      `
  // DO NOT MODIFY. This file is automatically generated in initDevAndTest.ts

  ${databaseAdapter}
  `,
    )

    console.log('Wrote', dbAdapter, 'db adapter')
  }

  // Generate importMap
  const testDir = path.resolve(dirname, testSuiteArg)

  const pathWithConfig = path.resolve(testDir, 'config.ts')
  console.log('Generating import map for config:', pathWithConfig)

  const config = await load(pathWithConfig)

  process.env.ROOT_DIR = testSuiteArg === 'live-preview' ? testDir : path.resolve(dirname, '..')

  await generateImportMap(config, { log: true, force: true })

  console.log('Done')
}

void initDevAndTest()
