import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const FFMPEG = 'ffmpeg'
const CHUNK_DURATION = 5
const FADE_DURATION = 1

export async function joinChunksWithMusic(
  chunkFiles,
  output = 'public/final/final_video.mp4',
  audioFile = 'public/audio/music.mp3'
) {
  if (!fs.existsSync(path.dirname(output)))
    fs.mkdirSync(path.dirname(output), { recursive: true })

  const absChunkFiles = chunkFiles.map((f) => path.resolve(f))
  const absAudioFile = path.resolve(audioFile)
  const inputs = absChunkFiles.map((f) => `-i "${f}"`).join(' ')

  // Build xfade filter chain
  let filter = ''
  let lastStream = '[0:v]'
  // Start fade 1 second before the previous chunk ends (at 4 seconds for first transition)
  let offset = CHUNK_DURATION - FADE_DURATION

  for (let i = 1; i < absChunkFiles.length; i++) {
    const outStream = `[v${i}]`
    filter += `${lastStream}[${i}:v]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}${outStream};`
    lastStream = outStream
    // Each subsequent chunk starts fading CHUNK_DURATION seconds after the previous offset
    offset += CHUNK_DURATION
  }

  // Final scaling, padding, and format
  filter += `${lastStream}scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[vid]`

  const cmd =
    `${FFMPEG} -y ${inputs} -i "${absAudioFile}" ` +
    `-filter_complex "${filter}" ` +
    `-map "[vid]" -map ${absChunkFiles.length}:a ` +
    `-c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 192k -shortest "${path.resolve(output)}"`

  console.log('🎬 Merging chunks with crossfade transitions...')
  await execAsync(cmd)
  console.log(`✅ Final video ready → ${output}`)
  return output
}
