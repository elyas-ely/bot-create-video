import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// --- CONFIG ---
const imagesFolder = 'public'
const audioFile = 'public/music.mp3'
const videoDuration = 30 // total video length in seconds
const fadeDuration = 1 // crossfade duration in seconds
const outputFile = 'output.mp4'

// --- STEP 1: Read images ---
let images = fs
  .readdirSync(imagesFolder)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .map((f) => path.join(imagesFolder, f))

if (images.length < 2) {
  console.error('❌ Need at least 2 images for crossfade.')
  process.exit(1)
}

// --- STEP 2: Create FFmpeg input string ---
let inputs = ''
let filter = ''
const numImages = images.length

// We'll loop each image 1 time in the filter, FFmpeg will trim to 30s at the end
images.forEach((img) => {
  inputs += `-loop 1 -t ${videoDuration} -i "${img}" `
})

// --- STEP 3: Build xfade chain dynamically ---
let offset = videoDuration / numImages // approximate offset
for (let i = 0; i < numImages - 1; i++) {
  const in1 = i === 0 ? `[${i}:v]` : `[v${i}]`
  const in2 = `[${i + 1}:v]`
  const out = `[v${i + 1}]`
  filter += `${in1}${in2}xfade=transition=fade:duration=${fadeDuration}:offset=${offset}${out};`
  offset += videoDuration / numImages
}

// remove trailing semicolon
filter = filter.slice(0, -1)

// --- STEP 4: FFmpeg command ---
const cmd = `ffmpeg -y ${inputs}-i "${audioFile}" -filter_complex "${filter}" -map "[v${numImages - 1}]" -map ${numImages}:a -t ${videoDuration} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${outputFile}"`

console.log('🚀 Running FFmpeg...')
exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ FFmpeg Error:', err)
    console.error(stderr)
    return
  }
  console.log(`✅ Video created successfully → ${outputFile}`)
})
