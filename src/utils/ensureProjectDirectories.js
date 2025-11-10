import fs from 'fs'

export function ensureProjectDirectories() {
  const dirs = [
    'public/images',
    'public/chunks',
    'public/audio',
    'public/final',
  ]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  }
}
