import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const FFMPEG = 'ffmpeg'
const BATCH_SIZE = 5 // Number of chunks per batch
const CHUNK_DURATION = 5 // seconds
const FADE_DURATION = 0.5 // shorter fade for low-spec VPS

async function runFFmpeg(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd)
    // if (stderr) console.log(stderr)
    return stdout
  } catch (err) {
    console.error('❌ FFmpeg error:', err.message)
    throw err
  }
}

function chunkArray(arr, size) {
  const batches = []
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size))
  }
  return batches
}

async function mergeBatch(batchFiles, batchIndex, tempDir) {
  // Sort files numerically
  batchFiles.sort((a, b) => {
    const numA = parseInt(a.match(/chunk_(\d+)/)?.[1] || '0')
    const numB = parseInt(b.match(/chunk_(\d+)/)?.[1] || '0')
    return numA - numB
  })

  const inputs = batchFiles.map((f) => `-i "${f}"`).join(' ')

  // Build xfade filters
  let filter = ''
  let lastStream = '[0:v]'
  let offset = CHUNK_DURATION - FADE_DURATION
  for (let i = 1; i < batchFiles.length; i++) {
    const outStream = `[v${i}]`
    filter += `${lastStream}[${i}:v]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}${outStream};`
    lastStream = outStream
    offset += CHUNK_DURATION - FADE_DURATION
  }

  filter += `${lastStream}scale=-1:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[vid]`

  const batchOutput = path.join(tempDir, `batch_${batchIndex}.mp4`)
  const cmd = `${FFMPEG} -y ${inputs} -filter_complex "${filter}" -map "[vid]" -c:v libx264 -preset veryfast -crf 23 "${batchOutput}"`
  // console.log(`🎬 Processing batch ${batchIndex}...`)
  await runFFmpeg(cmd)
  return batchOutput
}

export async function joinChunksWithMusic(
  chunkFiles,
  output = 'public/final/final_video.mp4',
  audioFile = 'public/audio/music.mp3'
) {
  const tempDir = path.join(path.dirname(output), 'temp_batches')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  // Split into batches
  const batches = chunkArray(chunkFiles, BATCH_SIZE)
  const batchOutputs = []

  for (let i = 0; i < batches.length; i++) {
    const batchOutput = await mergeBatch(batches[i], i, tempDir)
    batchOutputs.push(batchOutput)
  }

  // Merge all batch outputs without xfade (optional: you can apply minimal crossfade here)
  const listFile = path.join(tempDir, 'batch_list.txt')
  fs.writeFileSync(
    listFile,
    batchOutputs.map((f) => `file '${path.resolve(f)}'`).join('\n')
  )

  const intermediateOutput = path.join(tempDir, 'merged_batches.mp4')
  const concatCmd = `${FFMPEG} -y -f concat -safe 0 -i "${listFile}" -c copy "${intermediateOutput}"`
  // console.log('🎬 Concatenating all batches...')
  await runFFmpeg(concatCmd)

  // Add audio using stream_loop
  const finalAudioCmd = `${FFMPEG} -y -i "${intermediateOutput}" -stream_loop -1 -i "${audioFile}" -c:v copy -c:a aac -b:a 192k -shortest "${path.resolve(output)}"`
  // console.log('🎵 Adding music...')
  await runFFmpeg(finalAudioCmd)

  // Clean up temporary files
  fs.rmSync(tempDir, { recursive: true, force: true })

  console.log(`✅ Final video ready → ${output}`)
  return output
}
