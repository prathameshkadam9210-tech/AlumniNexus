import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const schema = process.env.VERCEL === '1'
  ? 'schema.postgresql.prisma'
  : 'schema.prisma'

execFileSync(process.execPath, [
  path.resolve(scriptDirectory, '..', 'node_modules', 'prisma', 'build', 'index.js'),
  'generate',
  '--schema',
  path.resolve(scriptDirectory, '..', 'prisma', schema),
], { stdio: 'inherit' })
