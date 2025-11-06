import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function createVideoFromImages() {
  const imagesFolder = 'images'
  const audioFile = 'public/music.mp3'
  const outputFile = 'output.mp4'
  const videoDuration = 30
  const fadeDuration = 1

  let images = fs
    .readdirSync(imagesFolder)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => path.join(imagesFolder, f))

  if (images.length < 2) {
    console.error('❌ Need at least 2 images for crossfade.')
    return
  }

  let inputs = ''
  let filter = ''
  const numImages = images.length

  images.forEach((img) => {
    inputs += `-loop 1 -t ${videoDuration} -i "${img}" `
  })

  let offset = videoDuration / numImages
  for (let i = 0; i < numImages - 1; i++) {
    const in1 = i === 0 ? `[${i}:v]` : `[v${i}]`
    const in2 = `[${i + 1}:v]`
    const out = `[v${i + 1}]`
    filter += `${in1}${in2}xfade=transition=fade:duration=${fadeDuration}:offset=${offset}${out};`
    offset += videoDuration / numImages
  }

  filter = filter.slice(0, -1)

  const cmd = `ffmpeg -y ${inputs}-i "${audioFile}" -filter_complex "${filter}" -map "[v${numImages - 1}]" -map ${numImages}:a -t ${videoDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${outputFile}"`

  try {
    console.log('🚀 Running FFmpeg...')
    const { stdout, stderr } = await execAsync(cmd)
    console.log(`✅ Video created successfully → ${outputFile}`)
  } catch (err) {
    console.error('❌ FFmpeg Error:', err)
  }
}
