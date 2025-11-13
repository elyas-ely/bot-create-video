import fs from 'fs'
import path from 'path'
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
  // Ensure output folder exists
  if (!fs.existsSync(path.dirname(output)))
    fs.mkdirSync(path.dirname(output), { recursive: true })

  // Use absolute paths for FFmpeg concat
  const absChunkFiles = chunkFiles.map((f) => path.resolve(f))
  const absAudioFile = path.resolve(audioFile)
  const listFile = path.join('public', 'chunks_list.txt')

  fs.writeFileSync(
    listFile,
    absChunkFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n')
  )

  const totalDuration = absChunkFiles.length * CHUNK_DURATION

  const cmd =
    `${FFMPEG} -y -f concat -safe 0 -i "${listFile}" -i "${absAudioFile}" ` +
    `-t ${totalDuration} -c:v libx264 -preset veryfast -crf 23 ` +
    `-vf "scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p" ` +
    `-c:a aac -b:a 192k -shortest "${path.resolve(output)}"`

  console.log('🎬 Merging chunks with audio...')
  await execAsync(cmd)

  fs.unlinkSync(listFile)
  console.log(`✅ Final video ready → ${output}`)
  return output
}
