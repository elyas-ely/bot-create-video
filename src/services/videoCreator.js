import { checkFFmpeg } from './ffmpegCheck.js'
import { createAllChunks, joinChunksWithMusic } from './videoChunks.js'
import { emptyChunksFolder } from '../utils/cleanup.js'

export async function createVideoFromImages() {
  // return console.log('3 - video created')
  await checkFFmpeg()

  const chunkFiles = await createAllChunks()
  const finalVideoPath = await joinChunksWithMusic(chunkFiles)

  return finalVideoPath
}
