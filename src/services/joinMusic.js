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

  // Ensure chunks are sorted by index/number if they come as paths
  const absChunkFiles = chunkFiles
    .map((f) => path.resolve(f))
    .sort((a, b) => {
      // Extract chunk number from filename (e.g., chunk_1.mp4 -> 1)
      const numA = parseInt(a.match(/chunk_(\d+)/)?.[1] || '0')
      const numB = parseInt(b.match(/chunk_(\d+)/)?.[1] || '0')
      return numA - numB
    })

  const absAudioFile = path.resolve(audioFile)
  const inputs = absChunkFiles.map((f) => `-i "${f}"`).join(' ')

  // Build xfade filter chain - ensure all chunks have fade transitions
  let filter = ''
  let lastStream = '[0:v]'
  // Start fade 1 second before the previous chunk ends (at 4 seconds for first transition)
  let offset = CHUNK_DURATION - FADE_DURATION

  // Apply fade transition between all consecutive chunks
  for (let i = 1; i < absChunkFiles.length; i++) {
    const outStream = `[v${i}]`
    // xfade syntax: [input1][input2]xfade=transition=fade:duration=X:offset=Y[output]
    filter += `${lastStream}[${i}:v]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}${outStream};`
    lastStream = outStream
    // Each subsequent chunk starts fading after the visible portion of the previous chunk
    offset += CHUNK_DURATION - FADE_DURATION
  }

  filter += `${lastStream}scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[vid]`

  const totalDuration =
    CHUNK_DURATION +
    (absChunkFiles.length - 1) * (CHUNK_DURATION - FADE_DURATION)

  const audioFilter = `[${absChunkFiles.length}:a]aloop=loop=-1:size=2e+09,atrim=0:${totalDuration},afade=t=out:st=${totalDuration - 0.5}:d=0.5[audio]`

  const cmd =
    `${FFMPEG} -y ${inputs} -i "${absAudioFile}" ` +
    `-filter_complex "${filter};${audioFilter}" ` +
    `-map "[vid]" -map "[audio]" ` +
    `-c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 192k -t ${totalDuration} "${path.resolve(output)}"`

  console.log('🎬 Merging chunks with crossfade transitions...')

  try {
    const { stdout, stderr } = await execAsync(cmd)
    console.log(`✅ Final video ready → ${output}`)
  } catch (error) {
    console.error('❌ FFmpeg error:', error.message)
    throw error
  }

  return output
}
