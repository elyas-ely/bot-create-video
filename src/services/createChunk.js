import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const FFMPEG = 'ffmpeg'
const CHUNK_DURATION = 5

export async function createVideoChunk(
  imagePath,
  index,
  chunkFolder = 'public/chunks'
) {
  if (!fs.existsSync(chunkFolder))
    fs.mkdirSync(chunkFolder, { recursive: true })
  const outputFile = path.join(chunkFolder, `chunk_${index}.mp4`)
  const cmd = `${FFMPEG} -y -loop 1 -i "${imagePath}" -t ${CHUNK_DURATION} -vf "scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p" -c:v libx264 -preset veryfast -crf 23 -an "${outputFile}"`
  await execAsync(cmd)
  console.log(`🎬 Chunk #${index} created`)
  return outputFile
}
