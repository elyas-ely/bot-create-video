import fs from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const FFMPEG = 'ffmpeg'
const CHUNK_DURATION = 5

export async function joinChunksWithMusic(
  chunkFiles,
  output = 'public/final/final_video.mp4',
  audioFile = 'public/audio/music.mp3'
) {
  fs.writeFileSync(listFile, chunkFiles.map((f) => `file '${f}'`).join('\n'))

  const totalDuration = chunkFiles.length * CHUNK_DURATION

  const cmd = `${FFMPEG} -y -f concat -safe 0 -i -vf "scale=1920:1080" -c:v libx264 -preset veryfast -crf 23 "${output}"`

  console.log('🎬 Merging chunks and looping music...')
  await execAsync(cmd)

  fs.unlinkSync(listFile)
  console.log(`✅ Final video ready → ${output}`)

  return output
}
