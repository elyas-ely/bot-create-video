import { checkFFmpeg } from './ffmpegCheck.js'
import { emptyChunksFolder } from '../utils/cleanup.js'
import { createAllChunks } from './createAllChunks.js'
import { joinChunksWithMusic } from './joinMusic.js'

export async function createVideoFromImages() {
  // return console.log('3 - video created')
  await checkFFmpeg()

  const chunkFiles = await createAllChunks()
  const finalVideoPath = await joinChunksWithMusic(chunkFiles)

  return finalVideoPath
}
