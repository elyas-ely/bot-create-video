import { checkFFmpeg } from './ffmpegCheck.js'
import { createAllChunks, joinChunksWithMusic } from './videoChunks.js'
import { emptyChunksFolder } from '../utils/cleanup.js'

export async function createVideoFromImages() {
  await checkFFmpeg()

  const chunkFiles = await createAllChunks()
  const finalVideoPath = await joinChunksWithMusic(chunkFiles)

  return finalVideoPath
}
