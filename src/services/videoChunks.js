import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

const execAsync = promisify(exec)

const FFMPEG = ffmpegStatic
const FFPROBE = ffprobeStatic
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

export async function createAllChunks(imagesFolder = 'public/images') {
  const images = fs
    .readdirSync(imagesFolder)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f, i) => ({ file: path.join(imagesFolder, f), index: i + 1 }))

  if (images.length < 1) {
    throw new Error('❌ No images found in public/images')
  }

  const chunks = []
  for (const img of images) {
    const chunk = await createVideoChunk(img.file, img.index)
    chunks.push(chunk)
  }
  return chunks
}

export async function joinChunksWithMusic(
  chunkFiles,
  output = 'public/final/final_video.mp4',
  audioFile = 'public/audio/music.mp3'
) {
  const listFile = 'chunks.txt'
  fs.writeFileSync(listFile, chunkFiles.map((f) => `file '${f}'`).join('\n'))

  const totalDuration = chunkFiles.length * CHUNK_DURATION

  const cmd = `${FFMPEG} -y -f concat -safe 0 -i "${listFile}" -stream_loop -1 -i "${audioFile}" -c:v copy -c:a aac -t ${totalDuration} "${output}"`

  console.log('🎬 Merging chunks and looping music...')
  await execAsync(cmd)

  fs.unlinkSync(listFile)
  console.log(`✅ Final video ready → ${output}`)

  return output
}
