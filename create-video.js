import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function createVideoChunk(imagePath, chunkIndex, chunkFolder = 'chunks') {
  if (!fs.existsSync(chunkFolder)) fs.mkdirSync(chunkFolder)

  const outputFile = path.join(chunkFolder, `chunk_${chunkIndex}.mp4`)
  const duration = 5 // each image stays 5 seconds

  const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -t ${duration} -c:v libx264 -pix_fmt yuv420p -an "${outputFile}"`

  console.log(`🚀 Creating chunk ${chunkIndex} → ${imagePath}`)
  await execAsync(cmd)
  console.log(`✅ Chunk ${chunkIndex} created → ${outputFile}`)

  return outputFile
}

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

async function joinChunksWithMusic(
  chunkFiles,
  finalOutput = 'final_video.mp4',
  audioFile = 'public/music.mp3'
) {
  const listFile = 'chunks.txt'
  fs.writeFileSync(listFile, chunkFiles.map((f) => `file '${f}'`).join('\n'))

  const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${audioFile}" -c:v copy -c:a aac -shortest "${finalOutput}"`
  console.log('🚀 Joining all chunks and adding music...')
  await execAsync(cmd)
  console.log(`✅ Final video created → ${finalOutput}`)

  fs.unlinkSync(listFile)
}

export async function createVideoFromImages() {
  const chunkFiles = await createAllChunks()
  if (chunkFiles.length > 0) {
    await joinChunksWithMusic(chunkFiles)
  }
}
