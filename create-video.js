import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { clearChunks } from './clearChunks.js'
import 'dotenv/config'

const execAsync = promisify(exec)

// ----------------- ENVIRONMENT SETUP -----------------
// const isProduction = process.env.NODE_ENV === 'production'

// console.log('isProduction', process.env.NODE_ENV)

const FFMPEG = 'ffmpeg'
const FFPROBE = 'ffprobe'

// ----------------- CHECK FFmpeg EXISTS -----------------
async function checkFFmpeg() {
  try {
    await execAsync(`${FFMPEG} -version`)
    await execAsync(`${FFPROBE} -version`)
  } catch (err) {
    console.error(`❌ FFmpeg/FFprobe not found at ${FFMPEG} or ${FFPROBE}`)
    process.exit(1)
  }
}

// ----------------- CREATE VIDEO CHUNK (one image) -----------------
async function createVideoChunk(imagePath, chunkIndex, chunkFolder = 'chunks') {
  if (!fs.existsSync(chunkFolder)) fs.mkdirSync(chunkFolder)

  const outputFile = path.join(chunkFolder, `chunk_${chunkIndex}.mp4`)
  const duration = 5

  const cmd = `${FFMPEG} -y -loop 1 -i "${imagePath}" -t ${duration} -c:v libx264 -pix_fmt yuv420p -an "${outputFile}"`
  console.log(`🚀 Creating chunk ${chunkIndex} → ${imagePath}`)
  await execAsync(cmd)
  console.log(`✅ Chunk ${chunkIndex} created → ${outputFile}`)

  return outputFile
}

// ----------------- CREATE ALL CHUNKS -----------------
async function createAllChunks(imagesFolder = 'images') {
  const images = fs
    .readdirSync(imagesFolder)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(imagesFolder, f))

  if (images.length < 1) {
    console.error('❌ Need at least 1 image.')
    return []
  }

  const chunks = []
  for (let i = 0; i < images.length; i++) {
    const chunkVideo = await createVideoChunk(images[i], i + 1)
    chunks.push(chunkVideo)
  }

  return chunks
}

// ----------------- JOIN CHUNKS AND ADD MUSIC (looped) -----------------
async function joinChunksWithMusic(
  chunkFiles,
  finalOutput = 'final_video.mp4',
  audioFile = 'public/music.mp3'
) {
  const listFile = 'chunks.txt'
  fs.writeFileSync(listFile, chunkFiles.map((f) => `file '${f}'`).join('\n'))

  // Get total video duration
  const { stdout: durationStdout } = await execAsync(
    `${FFPROBE} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${chunkFiles[chunkFiles.length - 1]}"`
  )
  const videoDuration = parseFloat(durationStdout) * chunkFiles.length // each chunk 5s

  // Loop the music to match video duration
  const cmd = `${FFMPEG} -y -f concat -safe 0 -i "${listFile}" -stream_loop -1 -i "${audioFile}" -c:v copy -c:a aac -t ${videoDuration} "${finalOutput}"`

  console.log('🚀 Joining all chunks and adding music (looped)...')
  await execAsync(cmd)
  console.log(`✅ Final video created → ${finalOutput}`)

  fs.unlinkSync(listFile)
}

// ----------------- RUN EVERYTHING -----------------
export async function createVideoFromImages() {
  await checkFFmpeg() // Ensure ffmpeg exists

  const chunkFiles = await createAllChunks()
  if (chunkFiles.length > 0) {
    await joinChunksWithMusic(chunkFiles)
    clearChunks() // Clear all chunk files after final video
  }
}
