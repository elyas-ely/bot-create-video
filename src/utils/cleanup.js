import fs from 'fs'
import path from 'path'

function emptyFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return
  for (const file of fs.readdirSync(folderPath)) {
    fs.unlinkSync(path.join(folderPath, file))
  }
  console.log(`🧹 Cleared: ${folderPath}`)
}

export function emptyChunksFolder() {
  emptyFolder('public/chunks')
}

export function emptyImagesFolder() {
  emptyFolder('public/images')
}
