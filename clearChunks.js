import fs from 'fs'
import path from 'path'

export function clearChunks(chunkFolder = 'chunks') {
  if (!fs.existsSync(chunkFolder)) return

  const files = fs.readdirSync(chunkFolder)
  for (const file of files) {
    fs.unlinkSync(path.join(chunkFolder, file))
  }

  console.log(`🗑️ Cleared all files in "${chunkFolder}"`)
}

export function clearImages(imagesFolder = 'images') {
  if (!fs.existsSync(imagesFolder)) return

  const files = fs.readdirSync(imagesFolder)
  for (const file of files) {
    fs.unlinkSync(path.join(imagesFolder, file))
  }

  console.log(`🗑️ Cleared all files in "${imagesFolder}"`)
}
