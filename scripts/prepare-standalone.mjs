import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const standaloneDir = join(process.cwd(), '.next', 'standalone')
const staticSource = join(process.cwd(), '.next', 'static')
const staticTarget = join(standaloneDir, '.next', 'static')
const publicSource = join(process.cwd(), 'public')
const publicTarget = join(standaloneDir, 'public')

if (!existsSync(standaloneDir)) {
  console.log('Standalone output was not created; skipping asset copy.')
  process.exit(0)
}

mkdirSync(join(standaloneDir, '.next'), { recursive: true })

if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true })
}

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true })
}

console.log('Prepared standalone assets.')
