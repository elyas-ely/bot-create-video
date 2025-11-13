import fs from 'fs'
import path from 'path'

import { createVideoChunk } from './createChunk.js'

export async function createAllChunks(imagesFolder = 'public/images') {
  const images = fs
    .readdirSync(imagesFolder)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f, i) => ({ file: path.join(imagesFolder, f), index: i + 1 }))

  if (images.length < 1) {
    throw new Error('❌ No images found in public/images')
  }

  const chunks = []
  for (const img of images) {
    const chunk = await createVideoChunk(img.file, img.index)
    chunks.push(chunk)
  }
  return chunks
}
