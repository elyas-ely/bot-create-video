import { checkFFmpeg } from '../services/ffmpegCheck.js'
import { createAllChunks } from '../services/createAllChunks.js'
import { joinChunksWithMusic } from '../services/joinMusic.js'

export async function createVideoFromImages() {
  console.log('🔥 Starting video creation workflow...')

  try {
    await checkFFmpeg()

    const chunks = await createAllChunks()
    if (!chunks || chunks.length === 0) {
      throw new Error('❌ No chunks were created.')
    }

    // Optional: Log countdown while waiting
    const waitMinutes = 5
    console.log(
      `⏳ Cooling down for ${waitMinutes} minutes before joining chunks...`
    )

    for (let i = waitMinutes; i > 0; i--) {
      console.log(`⏳ ${i} minute(s) remaining...`)
      await Bun.sleep(60 * 1000)
    }

    console.log('🎵 Joining chunks with music...')
    const finalVideoPath = await joinChunksWithMusic(chunks)

    return finalVideoPath
  } catch (err) {
    console.error('❌ Error in createVideoFromImages():', err)
    throw err
  }
}
