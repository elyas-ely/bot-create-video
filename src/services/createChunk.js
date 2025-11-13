import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

const FFMPEG = 'ffmpeg'
const CHUNK_DURATION = 5 // seconds

export async function createVideoChunk(
  imagePath,
  index,
  chunkFolder = 'public/chunks'
) {
  if (!fs.existsSync(chunkFolder))
    fs.mkdirSync(chunkFolder, { recursive: true })

  const outputFile = path.join(chunkFolder, `chunk_${index}.mp4`)

  const cmd = `${FFMPEG} -y -loop 1 -i "${imagePath}" -t ${CHUNK_DURATION} -c:v libx264 -pix_fmt yuv420p -an "${outputFile}"`
  console.log(`🚀 Creating chunk #${index} → ${outputFile}`)
  await execAsync(cmd)

  return outputFile
}
